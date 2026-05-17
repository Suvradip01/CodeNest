const startedAt = Date.now();
const requestMetrics = {
    total: 0,
    byRoute: {},
    byStatus: {}
};

module.exports = {
    startedAt,
    requestMetrics
};
