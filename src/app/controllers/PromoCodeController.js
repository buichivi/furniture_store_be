const Joi = require('joi');
const PromoCode = require('../../models/PromoCode');

const promoCodeSchema = Joi.object({
    code: Joi.string().required().messages({
        'string.empty': 'Promo code is required',
        'any.required': 'Promo code is required',
    }),
    type: Joi.string().valid('voucher', 'coupon').required().messages({
        'string.empty': 'Type is required',
        'any.only': 'Type must be either voucher or coupon',
        'any.required': 'Type is required',
    }),
    discount: Joi.number()
        .required()
        .when('type', {
            is: 'coupon',
            then: Joi.number().min(0).max(100).messages({
                'number.base': 'Discount must be a number',
                'number.min': 'Discount must be at least 0 for coupons',
                'number.max': 'Discount cannot exceed 100 for coupons',
            }),
            otherwise: Joi.number().positive().messages({
                'number.base': 'Discount must be a number',
                'number.positive':
                    'Discount must be a positive number for vouchers',
            }),
        })
        .messages({
            'number.base': 'Discount must be a number',
            'any.required': 'Discount is required',
        }),
    startDate: Joi.date().min('now').required().messages({
        'date.base': 'Start date must be a valid date',
        'date.min': 'Start date must be in the future',
        'any.required': 'Start date is required',
    }),
    endDate: Joi.date().greater(Joi.ref('startDate')).required().messages({
        'date.base': 'End date must be a valid date',
        'date.greater': 'End date must be after the start date',
        'any.required': 'End date is required',
    }),
    maxUsage: Joi.number().integer().positive().required().messages({
        'number.base': 'Max uses must be a number',
        'number.integer': 'Max uses must be an integer',
        'number.positive': 'Max uses must be a positive number',
        'any.required': 'Max uses is required',
    }),
});

class PromoCodeController {
    // [GET] /
    async getAllPromoCode(req, res) {
        const promoCodes = await PromoCode.find();
        res.status(200).json({ promoCodes });
    }

    // [GET] /:promoCode
    async getPromoCode(req, res) {
        const promoCode = req.params.promoCode.toUpperCase();
        const existed_promoCode = await PromoCode.findOne({ code: promoCode });
        if (!existed_promoCode) {
            return res.status(404).json({ error: 'Not found promo code' });
        }
        if (!existed_promoCode.active) {
            return res
                .status(404)
                .json({ error: 'This promo code has not been activated' });
        }
        if (existed_promoCode.currentUses >= existed_promoCode.maxUsage) {
            return res
                .status(404)
                .json({ error: 'This promo code has reached its usage limit' });
        }
        res.status(200).json({
            message: 'Apply promo code successfully!',
            promoCode: existed_promoCode,
        });
    }

    // [POST] /
    async createPromoCode(req, res) {
        const { value, error } = promoCodeSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error?.details[0].message });
        }
        try {
            const newPromoCode = new PromoCode({
                ...value,
                code: value.code.toUpperCase(),
            });
            await newPromoCode.save();
            res.status(201).json({
                message: 'Create promo code successfully!',
                promoCode: newPromoCode,
            });
        } catch (err) {
            res.status(500).json({
                message: 'Error creating promo code',
                error,
            });
        }
    }

    // [PATCH] /:id
    async toggleActive(req, res) {
        const id = req.params.id;
        const active = req.body.active || false;
        const promoCode = await PromoCode.findById(id);
        if (!promoCode) {
            return res.status(404).json({ error: 'Promo code is not found' });
        }
        try {
            await promoCode.updateOne({ active }, { new: true });
            return res.status(200).json({
                message: 'Update promo code successfully!',
                promoCode,
            });
        } catch (err) {
            res.status(404).json({
                error: err?.message || 'Something went wrong',
            });
        }
    }

    // [PUT] /:id
    async changePromoCode(req, res) {
        const id = req.params.id;
        const promoCode = await PromoCode.findById(id);
        if (!promoCode) {
            return res.status(404).json({ error: 'Promo code is not found' });
        }
        const { value, error } = promoCodeSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error?.details[0].message });
        }
        try {
            await promoCode.updateOne({ ...value }, { new: true });
            return res.status(200).json({
                message: 'Update promo code successfully!',
                promoCode,
            });
        } catch (error) {
            res.status(500).json({
                error: error.message || 'Something went wrong',
            });
        }
    }

    // [DELETE] /:id
    async deletePromoCode(req, res) {
        const id = req.params.id;
        const promoCode = await PromoCode.findById(id);
        if (!promoCode) {
            return res.status(404).json({ error: 'Promo code is not found' });
        }
        try {
            await promoCode.deleteOne();
            res.status(200).json({
                message: 'Delete promo code successfully!',
            });
        } catch (error) {
            res.status(500).json({
                error: error.message || 'Something went wrong',
            });
        }
    }
}

module.exports = new PromoCodeController();
