const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SliderSchema = new Schema(
    {
        title: { type: String, required: true, unique: true },
        heading: { type: String, required: true },
        image: { type: String, required: true },
        description: { type: String, required: true },
        link: { type: String, required: true },
        active: { type: Boolean, required: true, default: true },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Slider', SliderSchema);
