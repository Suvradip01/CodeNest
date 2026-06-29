const mongoose = require('mongoose');

// Disable query buffering so that queries fail fast instead of hanging when disconnected
mongoose.set('bufferCommands', false);

const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codenest';
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // fail fast after 5 seconds instead of hanging
        });
        console.log('Connected to MongoDB successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        // Fallback to local MongoDB if remote connection fails
        if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb://localhost:27017/codenest') {
            console.log('Attempting local MongoDB fallback...');
            try {
                await mongoose.connect('mongodb://localhost:27017/codenest', {
                    serverSelectionTimeoutMS: 2000
                });
                console.log('Connected to fallback local MongoDB');
            } catch (fallbackErr) {
                console.error('Local fallback MongoDB also failed:', fallbackErr);
            }
        }
    }
};

module.exports = connectDB;
