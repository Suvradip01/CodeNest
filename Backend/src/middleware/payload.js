function ensureTextPayloadWithinLimit(fieldName, maxBytes) {
    return (req, res, next) => {
        const value = req.body?.[fieldName];
        if (typeof value !== 'string') return next();

        if (Buffer.byteLength(value, 'utf8') > maxBytes) {
            return res.status(413).json({
                error: `${fieldName} exceeds the ${maxBytes} byte limit`
            });
        }

        next();
    };
}

module.exports = { ensureTextPayloadWithinLimit };
