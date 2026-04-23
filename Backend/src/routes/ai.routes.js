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
        const status = error?.status || error?.code || error?.error?.code
        const msg = String(error?.message || "")
        if (status === 429 || msg.includes("429")) {
            return res.status(429).json({ error: "AI rate-limited. Please try again shortly." });
        }
        if (status === 503 || msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
            return res.status(503).json({ error: "AI temporarily unavailable. Please try again shortly." });
        }
        res.status(500).json({ error: "Internal Server Error" })
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
        const status = error?.status || error?.code || error?.error?.code
        const msg = String(error?.message || "")
        if (status === 429 || msg.includes("429")) {
            return res.status(429).json({ error: "AI rate-limited. Please try again shortly." });
        }
        if (status === 503 || msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
            return res.status(503).json({ error: "AI temporarily unavailable. Please try again shortly." });
        }
        res.status(500).json({ error: "Internal Server Error" })
    }
}
