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

app.post('/code/run', async (req, res) => {
    const code = req.body.code
    const lang = String(req.body.language || 'javascript').toLowerCase()

    if (!code) return res.status(400).send('Code is required')

    // Map frontend language names to Piston API identifiers and file names
    const LANGUAGE_MAP = {
        'javascript': { language: 'js', version: '18.15.0', filename: 'index.js' },
        'python': { language: 'python', version: '3.10.0', filename: 'script.py' },
        'java': { language: 'java', version: '15.0.2', filename: 'Main.java' },
        'c': { language: 'c', version: '10.2.0', filename: 'main.c' }
    }

    const target = LANGUAGE_MAP[lang] || LANGUAGE_MAP.javascript

    try {
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: target.language,
                version: target.version,
                files: [{ name: target.filename, content: code }]
            })
        })

        const data = await response.json()

        if (data.run) {
            const output = []
            if (data.run.stdout) output.push(...data.run.stdout.split(/\r?\n/))
            if (data.run.stderr) output.push(...data.run.stderr.split(/\r?\n/))
            if (output.length === 0 && data.run.code !== 0) {
                output.push(`Process exited with code ${data.run.code}`)
            }
            res.json({ output: output.filter(line => line.length > 0) })
        } else {
            res.status(500).json({ error: 'Failed to execute code' })
        }
    } catch (error) {
        console.error('Execution Error:', error)
        res.status(500).json({ error: 'Internal server error during execution' })
    }
})

module.exports = app
