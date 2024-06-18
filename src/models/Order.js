const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    color: { type: Schema.Types.ObjectId, ref: 'Color', required: true },
    quantity: { type: Number, required: true },
    itemPrice: { type: Number, required: true },
});

const OrderSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        items: [OrderItemSchema],
        totalAmount: { type: Number, required: true },
        paymentMethod: {
            type: String,
            default: 'cod',
            enum: ['cod', 'paypal', 'vnpay'],
        },
        paymentStatus: {
            type: String,
            default: 'pending',
            enum: [
                'pending',
                'failed',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
                'completed',
            ],
        },
        shippingAddress: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            city: { type: Object, required: true },
            district: { type: Object, required: true },
            ward: { type: Object, required: true },
            addressLine: { type: String, required: true },
        },
        promoCode: {
            type: Schema.Types.ObjectId,
            ref: 'PromoCode',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
