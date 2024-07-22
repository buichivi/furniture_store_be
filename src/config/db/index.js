const mongoose = require('mongoose');
const connect = async () => {
    try {
        await mongoose
            .connect(process.env.MONGO_URL)
            .then(() => console.log('Connected!'));
    } catch (err) {
        console.log('Failed!');
    }
};

module.exports = {
    connect,
};
