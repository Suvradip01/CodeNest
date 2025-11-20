const aiService = require("../services/ai.services")


module.exports.getReview = async (req, res) => {

    const code = req.body.code;

    if (!code) {
        return res.status(400).send("Prompt is required");
    }

    const response = await aiService(code);


    res.send(response);

}
module.exports.editCode = async (req, res) => {
    const prompt = req.body.prompt
    const code = req.body.code
    if (!prompt || !code) return res.status(400).send("Prompt and code are required")
    const updated = await aiService.editCode(prompt, code)
    res.send(updated)
}