const mongoose = require('mongoose');
const connect = async () => {
    try {
        await mongoose
            .connect('mongodb://localhost:27017/furniture_store')
            .then(() => console.log('Connected!'));
    } catch (err) {
        console.log('Failed!');
    }
};

module.exports = {
    connect,
};
