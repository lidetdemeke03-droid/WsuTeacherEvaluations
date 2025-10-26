const { connectDB, disconnectDB } = require('./src/config/db');

module.exports = async () => {
    await connectDB();
};
