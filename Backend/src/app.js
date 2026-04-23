const express = require('express')
const aiRoutes = require('./routes/ai.routes')
const projectRoutes = require('./routes/project.routes')
const cors = require('cors')
const aiServices = require('./services/ai.services')

const app = express()

// Allow requests from the frontend
app.use(cors())

// Parse JSON bodies
app.use(express.json())

app.get('/', (req, res) => { res.send('CodeNest Backend — Running') })

// ─── Project Management Endpoints (Disk-based) ─────────────────────────────
app.use('/projects', projectRoutes)

// ─── Existing AI endpoints ─────────────────────────────────────────────────
app.post('/ai/get-review', aiRoutes.getReview)
app.post('/ai/edit-code', aiRoutes.editCode)

// ─── Feature 1: Live AI Layer ──────────────────────────────────────────────
app.post('/ai/live-check', async (req, res) => {
    const { code, language } = req.body
    if (!code || !code.trim()) return res.json({ warnings: [], suggestions: [], complexity: 'Simple' })
    try {
        const result = await aiServices.liveCheck(code, language || 'javascript')
        res.json(result)
    } catch (err) {
        console.error('Live check error:', err.message)
        const status = err?.status || err?.code || err?.error?.code
        if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' })
        if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' })
        res.status(500).json({ error: 'Live check failed' })
    }
})

// ─── Feature 3: Versioning — Explain Diff ─────────────────────────────────
app.post('/ai/explain-diff', async (req, res) => {
    const { oldCode, newCode } = req.body
    if (!oldCode || !newCode) return res.status(400).json({ error: 'oldCode and newCode required' })
    try {
        const explanation = await aiServices.explainDiff(oldCode, newCode)
        res.json({ explanation })
    } catch (err) {
        console.error('Explain diff error:', err.message)
        const status = err?.status || err?.code || err?.error?.code
        if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' })
        if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' })
        res.status(500).json({ error: 'Diff explanation failed' })
    }
})

// ─── Feature 4: AI Debug Mode ─────────────────────────────────────────────
app.post('/ai/debug-fix', async (req, res) => {
    const { code, errorOutput, language } = req.body
    if (!code || !errorOutput) return res.status(400).json({ error: 'code and errorOutput required' })
    try {
        const result = await aiServices.debugFix(code, errorOutput, language || 'javascript')
        res.json(result)
    } catch (err) {
        console.error('Debug fix error:', err.message)
        const status = err?.status || err?.code || err?.error?.code
        if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' })
        if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' })
        res.status(500).json({ error: 'Debug fix failed' })
    }
})

// ─── Feature 5: Visual Execution ──────────────────────────────────────────
app.post('/ai/visualize', async (req, res) => {
    const { code, language } = req.body
    if (!code) return res.status(400).json({ error: 'code required' })
    try {
        const diagram = await aiServices.visualizeCode(code, language || 'javascript')
        res.json({ diagram })
    } catch (err) {
        console.error('Visualize error:', err.message)
        const status = err?.status || err?.code || err?.error?.code
        if (status === 429) return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' })
        if (status === 503) return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' })
        res.status(500).json({ error: 'Visualization failed' })
    }
})

// ─── Code Execution Local Runner ────────────────────────────────────────
app.post('/code/run', async (req, res) => {
    const code = req.body.code
    const lang = String(req.body.language || 'javascript').toLowerCase()

    if (!code) return res.status(400).send('Code is required')

    const { exec } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    try {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codenest-'));
        let cmd = '';
        let filename = '';

        if (lang === 'javascript') {
            filename = 'index.js';
            fs.writeFileSync(path.join(tempDir, filename), code);
            cmd = `node ${filename}`;
        } else if (lang === 'python') {
            filename = 'script.py';
            fs.writeFileSync(path.join(tempDir, filename), code);
            // In Windows usually `python`, in Linux/Mac `python3`
            cmd = os.platform() === 'win32' ? `python ${filename}` : `python3 ${filename} || python ${filename}`;
        } else if (lang === 'java') {
            filename = 'Main.java';
            fs.writeFileSync(path.join(tempDir, filename), code);
            cmd = `javac Main.java && java Main`;
        } else if (lang === 'c') {
            filename = 'main.c';
            fs.writeFileSync(path.join(tempDir, filename), code);
            cmd = os.platform() === 'win32' ? `gcc main.c -o main.exe && main.exe` : `gcc main.c -o main && ./main`;
        } else {
            filename = 'index.js';
            fs.writeFileSync(path.join(tempDir, filename), code);
            cmd = `node ${filename}`;
        }

        exec(cmd, { cwd: tempDir, timeout: 10000 }, (error, stdout, stderr) => {
            // Clean up async to avoid blocking
            fs.rm(tempDir, { recursive: true, force: true }, () => {});

            let exitCode = 0;
            if (error) {
                exitCode = error.code || 1;
            }

            const stdoutLines = stdout ? String(stdout).split(/\r?\n/) : [];
            const stderrLines = stderr ? String(stderr).split(/\r?\n/) : [];
            
            // If there's an error but no stderr, add the error message
            if (error && stderrLines.filter(l => l.trim().length > 0).length === 0) {
                stderrLines.push(error.message);
            }

            const output = [...stdoutLines, ...stderrLines].filter(line => line.length > 0);
            if (output.length === 0 && exitCode !== 0) {
                output.push(`Process exited with code ${exitCode}`);
            }

            res.json({
                output,
                stderr: stderrLines.filter(l => l.length > 0),
                exitCode
            });
        });
    } catch (error) {
        console.error('Execution Error:', error)
        res.status(200).json({
            output: ['Execution failed locally.'],
            stderr: [error?.message || String(error)],
            exitCode: 1,
        })
    }
})

module.exports = app
