const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItem = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    color: { type: Schema.Types.ObjectId, required: true },
    quantity: { type: Number, min: 1, default: 1, required: true },
});

const CartSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        sessionId: { type: String, required: false },
        items: [CartItem],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cart', CartSchema);
