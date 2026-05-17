const aiServices = require("../services/ai.services");

function handleAiError(err, res, defaultMsg = 'Internal Server Error') {
    const status = err?.status || err?.code || err?.error?.code;
    const msg = String(err?.message || "");
    if (status === 429 || msg.includes("429")) {
        return res.status(429).json({ error: 'AI rate-limited. Please retry shortly.' });
    }
    if (status === 503 || msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
        return res.status(503).json({ error: 'AI temporarily unavailable. Please retry shortly.' });
    }
    res.status(500).json({ error: defaultMsg });
}

exports.getReview = async (req, res) => {
    const code = req.body.code;
    if (!code) return res.status(400).send("Prompt is required");
    try {
        const response = typeof aiServices === 'function' ? await aiServices(code) : (aiServices.getReview ? await aiServices.getReview(code) : null);
        if (!response && typeof aiServices !== 'function') throw new Error('AI service method not found');
        res.send(response);
    } catch (error) {
        console.error("Error in getReview:", error);
        handleAiError(error, res);
    }
};

exports.editCode = async (req, res) => {
    const { prompt, code } = req.body;
    if (!prompt || !code) return res.status(400).send("Prompt and code are required");
    try {
        const updated = await aiServices.editCode(prompt, code);
        res.send(updated);
    } catch (error) {
        console.error("Error in editCode:", error);
        handleAiError(error, res);
    }
};

exports.liveCheck = async (req, res) => {
    const { code, language } = req.body;
    if (!code || !code.trim()) return res.json({ warnings: [], suggestions: [], complexity: 'Simple' });
    try {
        const result = await aiServices.liveCheck(code, language || 'javascript');
        res.json(result);
    } catch (err) {
        console.error('Live check error:', err.message);
        handleAiError(err, res, 'Live check failed');
    }
};

exports.explainDiff = async (req, res) => {
    const { oldCode, newCode } = req.body;
    if (!oldCode || !newCode) return res.status(400).json({ error: 'oldCode and newCode required' });
    try {
        const explanation = await aiServices.explainDiff(oldCode, newCode);
        res.json({ explanation });
    } catch (err) {
        console.error('Explain diff error:', err.message);
        handleAiError(err, res, 'Diff explanation failed');
    }
};

exports.debugFix = async (req, res) => {
    const { code, errorOutput, language } = req.body;
    if (!code || !errorOutput) return res.status(400).json({ error: 'code and errorOutput required' });
    try {
        const result = await aiServices.debugFix(code, errorOutput, language || 'javascript');
        res.json(result);
    } catch (err) {
        console.error('Debug fix error:', err.message);
        handleAiError(err, res, 'Debug fix failed');
    }
};

exports.visualizeCode = async (req, res) => {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });
    try {
        const diagram = await aiServices.visualizeCode(code, language || 'javascript');
        res.json({ diagram });
    } catch (err) {
        console.error('Visualize error:', err.message);
        handleAiError(err, res, 'Visualization failed');
    }
};
