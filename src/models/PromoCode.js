const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PromoCode = new Schema(
    {
        code: {
            type: String,
            unique: true,
            required: [true, 'Promo code is required'],
            trim: true,
        },
        type: {
            type: String,
            required: [true, 'Type is required'],
            enum: ['coupon', 'voucher'], // Chỉ cho phép giá trị là 'coupon' hoặc 'voucher'
        },
        discount: {
            type: Number,
            required: [true, 'Discount is required'],
            validate: {
                validator: function (value) {
                    if (this.type === 'coupon') {
                        return value >= 0 && value <= 100;
                    } else if (this.type === 'voucher') {
                        return value > 0;
                    }
                    return false;
                },
                message: function (props) {
                    if (this.type === 'coupon') {
                        return 'Discount must be between 0 and 100 for coupons';
                    } else if (this.type === 'voucher') {
                        return 'Discount must be a positive number for vouchers';
                    }
                    return 'Invalid discount value';
                },
            },
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        currentUses: {
            type: Number,
            min: [0, 'Current uses cannot be negative'],
            default: 0,
        },
        maxUsage: {
            type: Number,
            min: [1, 'Max usage must be at least 1'],
            required: [true, 'Max usage is required'],
        },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PromoCode', PromoCode);
