require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first');

const cluster = require('cluster');
const os = require('os');

// In production use all CPU cores; in development keep it to 1 for easy debugging
const WORKERS = process.env.NODE_ENV === 'production'
    ? (Number(process.env.CLUSTER_WORKERS) || os.cpus().length)
    : 1;

const PORT = Number(process.env.PORT || 3000);

if (cluster.isPrimary) {
    console.log(`[Cluster] Primary PID ${process.pid} starting ${WORKERS} worker(s)…`);

    // Fork one worker per CPU core
    for (let i = 0; i < WORKERS; i++) {
        cluster.fork();
    }

    // Auto-respawn crashed workers
    cluster.on('exit', (worker, code, signal) => {
        console.warn(
            `[Cluster] Worker ${worker.process.pid} died (code=${code}, signal=${signal}). Respawning…`
        );
        cluster.fork();
    });

    cluster.on('online', (worker) => {
        console.log(`[Cluster] Worker ${worker.process.pid} is online.`);
    });

} else {
    // Worker process — run the Express app
    const app = require('./src/app');

    app.listen(PORT, () => {
        console.log(`[Worker ${process.pid}] Server listening on port ${PORT}`);
    });
}

