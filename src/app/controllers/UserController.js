const User = require('../../models/User');

class UserController {
    // [GET] /user
    async index(req, res, next) {
        // next sẽ đẩy err đến 1 nơi để xử lý tập trung
        try {
            const users = await User.find();
            res.json(users);
        } catch (err) {
            next(err);
        }
        // User.find()
        //     .then((users) => res.json(users))
        //     .catch(next);
    }

    // [GET] /user/:id
    getUserById(req, res) {
        res.json(req.params);
    }

    // [POST] /user
    async createUser(req, res, next) {
        try {
            const user = new User(req.body);
            await user.save();
            res.json(user);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UserController();
