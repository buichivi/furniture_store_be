const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema(
    {
        avatar: { type: String },
        firstName: { type: String, maxLength: 50, required: true },
        lastName: { type: String, maxLength: 50, required: true },
        email: { type: String, maxLength: 255, required: true },
        password: { type: String, maxLength: 255, required: true },
        phoneNumber: { type: String, maxLength: 10, required: true },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', User);
