const axios = require('axios');

exports.runCode = async (req, res) => {
    const { code, language } = req.body;
    if (!code) return res.status(400).send('Code is required');

    try {
        const runnerUrl = process.env.RUNNER_URL || 'http://runner:3001';
        const response = await axios.post(`${runnerUrl}/run`, {
            code,
            language: language || 'javascript'
        }, { timeout: 15000 });

        res.json(response.data);
    } catch (err) {
        const allowLocalFallback = process.env.ALLOW_LOCAL_EXECUTION_FALLBACK === 'true';
        if (allowLocalFallback) {
            console.warn(`Runner unavailable, attempting direct local execution for ${language || 'javascript'}.`);
            const { spawn } = require('child_process');
            const fs = require('fs');
            const os = require('os');
            const path = require('path');

            const lang = String(language || 'javascript').toLowerCase();
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codenest-exec-'));
            
            try {
                let cmd = '';
                let args = [];
                let file = '';

                if (lang === 'javascript') {
                    file = 'index.js';
                    cmd = 'node';
                    args = [file];
                } else if (lang === 'python') {
                    file = 'script.py';
                    cmd = 'python3';
                    args = [file];
                } else if (lang === 'java') {
                    file = 'Main.java';
                    fs.writeFileSync(path.join(tempDir, file), code);
                    // Compile first
                    const compile = await new Promise((resolve) => {
                        const cp = spawn('javac', ['Main.java'], { cwd: tempDir });
                        cp.on('close', code => resolve(code));
                    });
                    if (compile !== 0) return res.json({ output: ['Compilation Error'], stderr: ['javac failed'], exitCode: compile });
                    cmd = 'java';
                    args = ['Main'];
                } else if (lang === 'c') {
                    file = 'main.c';
                    fs.writeFileSync(path.join(tempDir, file), code);
                    const compile = await new Promise((resolve) => {
                        const cp = spawn('gcc', ['main.c', '-o', 'main'], { cwd: tempDir });
                        cp.on('close', code => resolve(code));
                    });
                    if (compile !== 0) return res.json({ output: ['Compilation Error'], stderr: ['gcc failed'], exitCode: compile });
                    cmd = './main';
                    args = [];
                }

                if (cmd) {
                    if (lang !== 'java' && lang !== 'c') {
                        fs.writeFileSync(path.join(tempDir, file), code);
                    }
                    
                    const child = spawn(cmd, args, { cwd: tempDir });
                    let output = '';
                    let stderr = '';

                    child.stdout.on('data', data => output += data.toString());
                    child.stderr.on('data', data => stderr += data.toString());

                    const result = await new Promise((resolve) => {
                        const timer = setTimeout(() => {
                            child.kill();
                            resolve({ output: [output], stderr: ['Execution timed out'], exitCode: 124 });
                        }, 5000);

                        child.on('close', exitCode => {
                            clearTimeout(timer);
                            resolve({
                                output: output.split('\n').filter(Boolean),
                                stderr: stderr.split('\n').filter(Boolean),
                                exitCode: exitCode ?? 0
                            });
                        });
                    });
                    return res.json(result);
                }
            } catch (e) {
                console.error('Direct execution failed:', e);
            } finally {
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (err) {}
            }
        }

        console.error('Execution Service Error:', err.message);
        res.status(503).json({
            output: ['Code execution service is currently unavailable.'],
            stderr: [err.message],
            exitCode: 1
        });
    }
};
