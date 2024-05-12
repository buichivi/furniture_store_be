const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 0, max: 5, default: 0, required: true },
    comment: { type: String, default: '', required: true },
});
