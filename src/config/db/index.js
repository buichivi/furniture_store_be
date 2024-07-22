const mongoose = require('mongoose');
const connect = async () => {
    try {
        await mongoose
            // .connect('mongodb://localhost:27017/furniture_store')
            .connect(
                'mongodb+srv://buivi04062002:SOCngCl4MbSbH4XL@furniture-db.auruwxu.mongodb.net/FurnitureStore'
            )
            .then(() => console.log('Connected!'));
    } catch (err) {
        console.log('Failed!');
    }
};

module.exports = {
    connect,
};
