const { disconnectDB } = require('./src/config/db');

module.exports = async () => {
    await disconnectDB();
};
