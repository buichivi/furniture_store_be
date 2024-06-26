const Joi = require('joi');
const User = require('../../models/User');

const addressSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().length(10).required(),
    city: Joi.object().required(),
    district: Joi.object().required(),
    ward: Joi.object().required(),
    addressLine: Joi.string().required(),
});

class AddressController {
    // [POST] /addresses/
    async createAddress(req, res) {
        try {
            const user = await User.findById(req.userId);
            const { error, value } = addressSchema.validate(req.body);
            if (error) throw new Error(error.details[0].message);
            if (user.addresses.length > 0) user.addresses.push(value);
            else user.addresses.push({ ...value, isDefault: true });
            await user.save();
            return res.status(200).json({
                message: 'Create address successfully!',
                addresses: user.addresses,
            });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }

    // [PATCH] /addresses/:addressId
    async setDefaultAddress(req, res) {
        try {
            const addressId = req.params.addressId;
            const user = await User.findById(req.userId);
            const existedAddress = user.addresses.find(
                (add) => add._id == addressId
            );
            if (!existedAddress) throw new Error('Address not found');
            user.addresses = user.addresses.map((address) => {
                return address._id == addressId
                    ? { ...address._doc, isDefault: true }
                    : { ...address._doc, isDefault: false };
            });

            await user.save();
            return res.status(200).json({
                message: 'Set default address successfully!',
                addresses: user.addresses.map((address) =>
                    address._id == addressId
                        ? { ...address._doc, isDefault: true }
                        : { ...address._doc, isDefault: false }
                ),
            });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }

    // [PUT] /addresses/:addressId
    async editAddress(req, res) {
        try {
            const addressId = req.params.addressId;
            const user = await User.findById(req.userId);
            const existedAddress = user.addresses.find(
                (add) => add._id == addressId
            );
            if (!existedAddress) throw new Error('Address not found');

            const { error, value } = addressSchema.validate(req.body);
            if (error) throw new Error(error.details[0].message);
            user.addresses = user.addresses.map((add) =>
                add._id == addressId ? { ...value } : add
            );
            await user.save();
            return res.status(200).json({
                message: 'Edit address successfully!',
                addresses: user.addresses,
            });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }

    // [DELETE] /addresses/:addressId
    async deleteAddress(req, res) {
        try {
            const user = await User.findById(req.userId);
            const addressId = req.params.addressId;
            const existedAddress = user.addresses.find(
                (add) => add._id == addressId
            );
            if (!existedAddress) throw new Error('Address not found');
            user.addresses = user.addresses.filter(
                (add) => add._id != addressId
            );
            if (existedAddress.isDefault) {
                if (user.addresses.length >= 1) {
                    user.addresses[0].isDefault = true;
                }
            }
            await user.save();
            return res.status(200).json({
                message: 'Delete address successfully!',
                addresses: user.addresses,
            });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new AddressController();
