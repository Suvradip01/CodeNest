// Route handlers module used by Express: maps endpoints to controller-like functions
const aiService = require("../services/ai.services")

// POST /ai/get-review — returns markdown review
module.exports.getReview = async (req, res) => {
    const code = req.body.code
    if (!code) return res.status(400).send("Prompt is required")
    try {
        const response = await aiService(code)
        res.send(response)
    } catch (error) {
        console.error("Error in getReview:", error);
        const isRateLimit = error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'));
        if (isRateLimit) {
            return res.status(429).json({ error: "Service currently overloaded. Please try again in a few moments." });
        }
        res.status(500).send("Internal Server Error")
    }
}

// POST /ai/edit-code — returns updated source code
module.exports.editCode = async (req, res) => {
    const prompt = req.body.prompt
    const code = req.body.code
    if (!prompt || !code) return res.status(400).send("Prompt and code are required")
    try {
        const updated = await aiService.editCode(prompt, code)
        res.send(updated)
    } catch (error) {
        console.error("Error in editCode:", error);
        const isRateLimit = error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'));
        if (isRateLimit) {
            return res.status(429).json({ error: "Service currently overloaded. Please try again in a few moments." });
        }
        res.status(500).send("Internal Server Error")
    }
}
