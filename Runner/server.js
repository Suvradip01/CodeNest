const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json({ limit: process.env.RUNNER_JSON_LIMIT || '128kb' }));

const PORT = Number(process.env.RUNNER_PORT || 3001);
const TIMEOUT_MS = Number(process.env.RUNNER_TIMEOUT_MS || 5000);
const MAX_CODE_BYTES = Number(process.env.RUNNER_MAX_CODE_BYTES || 64 * 1024);
const MAX_QUEUE_SIZE = Number(process.env.RUNNER_MAX_QUEUE_SIZE || 25);
const MAX_CONCURRENT = Number(process.env.RUNNER_MAX_CONCURRENT || 2);
const startedAt = Date.now();

let activeCount = 0;
const queue = [];

function buildResponse(stdout, stderr, exitCode) {
    const stdoutLines = stdout ? stdout.split('\n').filter(line => line.length > 0) : [];
    const stderrLines = stderr ? stderr.split('\n').filter(line => line.length > 0) : [];

    return {
        output: [...stdoutLines, ...stderrLines],
        stderr: stderrLines,
        exitCode
    };
}

function runProcess(command, args, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            env: {
                PATH: process.env.PATH,
                HOME: '/tmp'
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timeoutHandle = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
        }, TIMEOUT_MS);

        child.stdout.on('data', chunk => stdout += chunk.toString());
        child.stderr.on('data', chunk => stderr += chunk.toString());

        child.on('error', error => {
            clearTimeout(timeoutHandle);
            if (error.code === 'ENOENT') {
                return resolve(buildResponse('', `${command} is not installed in the runner`, 127));
            }
            reject(error);
        });

        child.on('close', exitCode => {
            clearTimeout(timeoutHandle);
            if (timedOut) {
                stderr = `${stderr}\nExecution timed out (${TIMEOUT_MS}ms limit).`.trim();
                return resolve(buildResponse(stdout, stderr, 124));
            }

            resolve(buildResponse(stdout, stderr, exitCode ?? 1));
        });
    });
}

async function executeCode(code, language) {
    const lang = String(language || 'javascript').toLowerCase();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-'));

    try {
        if (lang === 'javascript') {
            fs.writeFileSync(path.join(tempDir, 'index.js'), code);
            return await runProcess('node', ['index.js'], tempDir);
        }

        if (lang === 'python') {
            fs.writeFileSync(path.join(tempDir, 'script.py'), code);
            return await runProcess('python3', ['script.py'], tempDir);
        }

        if (lang === 'java') {
            fs.writeFileSync(path.join(tempDir, 'Main.java'), code);
            const compile = await runProcess('javac', ['Main.java'], tempDir);
            if (compile.exitCode !== 0) return compile;
            return await runProcess('java', ['Main'], tempDir);
        }

        if (lang === 'c') {
            fs.writeFileSync(path.join(tempDir, 'main.c'), code);
            const compile = await runProcess('gcc', ['main.c', '-o', 'main'], tempDir);
            if (compile.exitCode !== 0) return compile;
            return await runProcess('./main', [], tempDir);
        }

        const error = new Error(`Unsupported language: ${lang}`);
        error.statusCode = 400;
        throw error;
    } finally {
        fs.rm(tempDir, { recursive: true, force: true }, () => {});
    }
}

function drainQueue() {
    while (activeCount < MAX_CONCURRENT && queue.length > 0) {
        const job = queue.shift();
        activeCount += 1;

        job.run()
            .then(job.resolve)
            .catch(job.reject)
            .finally(() => {
                activeCount -= 1;
                drainQueue();
            });
    }
}

function enqueueExecution(run) {
    return new Promise((resolve, reject) => {
        if (queue.length >= MAX_QUEUE_SIZE) {
            const error = new Error('Execution queue is full');
            error.statusCode = 429;
            return reject(error);
        }

        queue.push({ run, resolve, reject });
        drainQueue();
    });
}

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        activeCount,
        queuedCount: queue.length,
        maxConcurrent: MAX_CONCURRENT,
        maxQueueSize: MAX_QUEUE_SIZE,
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000)
    });
});

app.post('/run', async (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).send('Code is required');
    }

    if (Buffer.byteLength(String(code), 'utf8') > MAX_CODE_BYTES) {
        return res.status(413).json({
            output: [],
            stderr: [`Code exceeds the ${MAX_CODE_BYTES} byte runner limit.`],
            exitCode: 1
        });
    }

    try {
        const result = await enqueueExecution(() => executeCode(code, language));
        res.json({
            ...result,
            activeCount,
            queuedCount: queue.length
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            output: [],
            stderr: [error.message || 'Execution failed'],
            exitCode: 1
        });
    }
});

app.listen(PORT, () => console.log(`Execution Runner listening on port ${PORT}`));
