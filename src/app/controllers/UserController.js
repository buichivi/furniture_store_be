const User = require('../../models/User');
const Joi = require('joi');
const unlinkAsync = require('../../utils/removeImage');
const getFileUrl = require('../../utils/getFileUrl');

const userInfoSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().required(),
    password: Joi.string().required(),
    avatar: Joi.any(),
});

const passwordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
});

class UserController {
    // [PUT] /users
    async updateInfomation(req, res) {
        try {
            const { error, value } = userInfoSchema.validate({
                ...req.body,
                avatar: req?.file ? req?.file?.path : '',
            });
            if (error) throw new Error(error.details[0].message);
            const user = await User.findById(req.userId);
            if (!user.validPassword(value.password))
                throw new Error('Password is incorrect');
            delete value.password;
            await user.updateOne({ ...value });
            if (req.file && user.avatar) await unlinkAsync(user.avatar);
            res.status(200).json({
                message: "Update user's infomation successfully",
                updateFields: {
                    ...value,
                    avatar: req.file ? getFileUrl(req, req.file.path) : '',
                },
            });
        } catch (error) {
            if (req.file) await unlinkAsync(req.file.path);
            res.status(400).json({ error: error?.message });
        }
    }

    // [PATCH] /users/
    async updatePassword(req, res) {
        try {
            const { error, value } = passwordSchema.validate(req.body);
            if (error) throw new Error(error.details[0].message);
            const user = await User.findById(req.userId);
            if (!user.validPassword(value.currentPassword))
                throw new Error('Password is incorrect');
            user.setPassword(value.newPassword);
            await user.save();
            res.status(200).json({
                message: "Update user's password successfully",
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new UserController();
