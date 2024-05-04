const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/User');
const path = require('path');

const registerSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(12).required(),
    phoneNumber: Joi.string().required(),
    dateOfBirth: Joi.string().allow(''),
    avatar: Joi.any().allow(null),
});

class AuthController {
    // [POST] /api/auth/login
    async login(req, res) {
        const { email, password, remember } = req.body;
        try {
            const user = await User.findOne({ email });
            if (!user) throw new Error('User not found!');
            if (user.validPassword(password)) {
                const token = jwt.sign(
                    { userId: user._id },
                    process.env.SECRET_KEY,
                    { expiresIn: remember ? '30d' : '1d' }
                );
                await user.updateOne({ token });
                user.salt = undefined;
                user.password = undefined;
                return res
                    .status(200)
                    .json({ message: 'Login successful!', user, token });
            }
            throw new Error('Email or password is not correct!');
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    // [POST] /api/auth/register
    async register(req, res) {
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            console.log(error.details);
            return res.status(400).json({ error: error.details[0].message });
        }
        const {
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            dateOfBirth,
        } = value;

        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res
                .status(400)
                .json({ error: 'This email is already used' });
        const newUser = new User({
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            dateOfBirth,
        });
        newUser.setPassword(password);
        if (req.file)
            newUser.avatar = req.file.path.slice(7).replace(/\\/g, '/');
        else newUser.avatar = null;
        newUser
            .save()
            .then(() =>
                res.status(200).json({ message: 'Created a new user!' })
            )
            .catch((err) => res.status(400).json(err));
    }

    // [PATCH] /api/auth/logout
    async logout(req, res) {
        const user = await User.findOne({ _id: req.userId });
        if (!user) return res.sendStatus(401);
        await user.updateOne({ refreshToken: null });
        res.status(200).json({ message: 'Log out successful!' });
    }

    // [GET] /api/auth/me
    async getMe(req, res) {
        const user = await User.findOne({ _id: req.userId });
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        user.salt = undefined;
        user.password = undefined;
        user.token = undefined;
        res.status(200).json(user);
    }
}

module.exports = new AuthController();
