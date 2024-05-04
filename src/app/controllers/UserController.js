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
    }

    // [GET] /user/:id
    getUserById(req, res) {
        res.json(req.params);
    }

    // [POST] /api/user/avatar
    uploadAvatar(req, res, next) {
        res.json(req.file);
    }
}

module.exports = new UserController();
