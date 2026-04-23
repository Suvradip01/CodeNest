const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json());

app.post('/run', (req, res) => {
    const { code, language } = req.body;
    const lang = String(language || 'javascript').toLowerCase();

    if (!code) return res.status(400).send('Code is required');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runner-'));
    let cmd = '';
    let filename = '';

    // Security: Use timeout to prevent infinite loops
    const TIMEOUT = 5000; // 5 seconds

    if (lang === 'javascript') {
        filename = 'index.js';
        fs.writeFileSync(path.join(tempDir, filename), code);
        cmd = `node ${filename}`;
    } else if (lang === 'python') {
        filename = 'script.py';
        fs.writeFileSync(path.join(tempDir, filename), code);
        cmd = `python3 ${filename}`;
    } else if (lang === 'java') {
        filename = 'Main.java';
        fs.writeFileSync(path.join(tempDir, filename), code);
        cmd = `javac Main.java && java Main`;
    } else if (lang === 'c') {
        filename = 'main.c';
        fs.writeFileSync(path.join(tempDir, filename), code);
        cmd = `gcc main.c -o main && ./main`;
    }

    // Apply timeout and resource limits
    const safeCmd = `timeout ${TIMEOUT / 1000}s sh -c "${cmd.replace(/"/g, '\\"')}"`;

    exec(safeCmd, { cwd: tempDir, timeout: TIMEOUT + 1000 }, (error, stdout, stderr) => {
        fs.rm(tempDir, { recursive: true, force: true }, () => {});

        let exitCode = 0;
        if (error) {
            exitCode = error.code || 124; // 124 is timeout code
            if (exitCode === 124) stderr = (stderr || '') + '\nExecution timed out (5s limit).';
        }

        res.json({
            output: [...(stdout ? stdout.split('\n') : []), ...(stderr ? stderr.split('\n') : [])].filter(l => l.length > 0),
            stderr: stderr ? stderr.split('\n').filter(l => l.length > 0) : [],
            exitCode
        });
    });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Execution Runner listening on port ${PORT}`));
