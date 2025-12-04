// Express app setup: middleware, routes, and language runner endpoint
const express = require('express')
const aiRoutes = require('./routes/ai.routes')
const cors = require('cors')

const app = express()

// Allow requests from the frontend
app.use(cors())

// Parse JSON bodies
app.use(express.json())

// Health check route
app.get('/', (req, res) => { res.send('Hello World') })

// AI endpoints
app.post('/ai/get-review', aiRoutes.getReview)
app.post('/ai/edit-code', aiRoutes.editCode)

// Simple code runner for multiple languages (not sandboxed; for local dev only)
const { exec } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

app.post('/code/run', (req, res) => {
    const code = req.body.code
    const lang = String(req.body.language || 'javascript').toLowerCase()
    if (!code) return res.status(400).send('Code is required')

    // Create temp working directory per request
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cn-'))

    // Helper: run a shell command within the temp directory
    const run = (cmd) => {
        exec(cmd, { cwd: tmp, timeout: 5000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
            const out = stdout.toString()
            const errOut = stderr.toString()
            // Cleanup temp directory
            fs.rmSync(tmp, { recursive: true, force: true })
            if (err) return res.json({ output: out ? out.split(/\r?\n/) : [], error: errOut || String(err) })
            res.json({ output: out.split(/\r?\n/) })
        })
    }

    // Language-specific compilation/execution
    if (lang === 'javascript') {
        const file = path.join(tmp, 'main.js')
        fs.writeFileSync(file, code)
        run(`node "${file}"`)
        return
    }
    if (lang === 'python') {
        const file = path.join(tmp, 'main.py')
        fs.writeFileSync(file, code)
        run(`python "${file}"`)
        return
    }
    if (lang === 'java') {
        const file = path.join(tmp, 'Main.java')
        fs.writeFileSync(file, code)
        run(`javac Main.java && java Main`)
        return
    }
    if (lang === 'c') {
        const file = path.join(tmp, 'main.c')
        fs.writeFileSync(file, code)
        run(`gcc main.c -o main.exe && main.exe`)
        return
    }

    res.status(400).send('Unsupported language')
})

module.exports = app
