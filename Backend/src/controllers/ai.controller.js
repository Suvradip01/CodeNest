// Controller layer: receives HTTP requests and delegates to services
const aiService = require("../services/ai.services")


// POST /ai/get-review
// Body: { code: string }
// Calls the AI service to generate a markdown review for the provided code
module.exports.getReview = async (req, res) => {
    const code = req.body.code
    if (!code) return res.status(400).send("Prompt is required")
    const response = await aiService(code)
    res.send(response)
}
