const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const User = new Schema(
    {
        avatar: { type: String, default: '' },
        firstName: { type: String, maxLength: 50 },
        lastName: { type: String, maxLength: 50 },
        email: { type: String, maxLength: 255, required: true, unique: true },
        password: { type: String, maxLength: 255, required: true },
        phoneNumber: { type: String, maxLength: 10 },
        dateOfBirth: { type: Date },
        admin: { type: Boolean, default: false },
        salt: { type: String },
        token: { type: String, default: null },
        wishlist: [
            {
                product: { type: Schema.Types.ObjectId },
                addedAt: { type: String },
            },
        ],
        addresses: [
            {
                firstName: { type: String },
                lastName: { type: String },
                email: { type: String },
                phoneNumber: { type: String },
                city: { type: Object },
                district: { type: Object },
                ward: { type: Object },
                addressLine: { type: String },
                isDefault: { type: Boolean, default: false },
            },
        ],
    },
    { timestamps: true }
);

User.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.password = crypto
        .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
        .toString('hex');
};

User.methods.validPassword = function (password) {
    const hash = crypto
        .pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')
        .toString('hex');
    return this.password === hash;
};

module.exports = mongoose.model('User', User);
