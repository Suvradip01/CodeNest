// Route handlers module used by Express: maps endpoints to controller-like functions
const aiService = require("../services/ai.services")

// POST /ai/get-review — returns markdown review
module.exports.getReview = async (req, res) => {
    const code = req.body.code
    if (!code) return res.status(400).send("Prompt is required")
    const response = await aiService(code)
    res.send(response)
}

// POST /ai/edit-code — returns updated source code
module.exports.editCode = async (req, res) => {
    const prompt = req.body.prompt
    const code = req.body.code
    if (!prompt || !code) return res.status(400).send("Prompt and code are required")
    const updated = await aiService.editCode(prompt, code)
    res.send(updated)
}
