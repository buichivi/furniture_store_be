const Slider = require('../../models/Slider');
const getFileUrl = require('../../utils/getFileUrl');
const unlinkAsync = require('../../utils/removeImage');
const Joi = require('joi');

const sliderSchema = Joi.object({
    title: Joi.string().required(),
    heading: Joi.string().required(),
    image: Joi.any(),
    description: Joi.string().required(),
    link: Joi.string().required(),
});

const editSliderSchema = Joi.object({
    title: Joi.string().required(),
    heading: Joi.string().required(),
    image: Joi.any().allow(null),
    description: Joi.string(),
    link: Joi.string(),
});

class SliderController {
    // [GET] /sliders/
    async getSliders(req, res) {
        const sliders = await Slider.find();
        res.status(200).json({
            sliders: sliders.map((slider) => {
                return {
                    ...slider._doc,
                    image: getFileUrl(req, slider.image),
                };
            }),
        });
    }

    // [POST] /sliders/
    async createSlider(req, res) {
        try {
            const { error, value } = sliderSchema.validate(req.body);
            if (error) throw new Error(error?.details[0]?.message);
            const existedSlider = await Slider.findOne({ title: value.title });
            if (existedSlider) throw new Error('This slider title is existed');
            const newSlider = new Slider({
                ...value,
                image: req?.file ? req?.file?.path : '',
            });
            await newSlider.save();
            newSlider.image =
                newSlider.image == '' ? '' : getFileUrl(req, newSlider.image);
            res.status(200).json({
                message: 'Create slider successfully!',
                slider: newSlider,
            });
        } catch (error) {
            if (req?.file?.path) await unlinkAsync(req.file.path);
            res.status(400).json({ error: error?.message });
        }
    }

    // [PUT] /sliders/:sliderId
    async editSlider(req, res) {
        try {
            const sliderId = req.params.sliderId;
            const existedSlider = await Slider.findById(sliderId);
            if (!existedSlider) throw new Error('Slider not found');
            const { error, value } = editSliderSchema.validate(req.body);
            if (error) throw new Error(error.details[0].message);
            if (req?.file) await unlinkAsync(existedSlider.image);
            await existedSlider.updateOne({
                ...value,
                image: req?.file ? req?.file?.path : existedSlider.image,
            });
            existedSlider.image = getFileUrl(req, existedSlider.image);
            res.status(200).json({
                message: 'Update slider successfully!',
                slider: {
                    ...existedSlider._doc,
                    ...value,
                },
            });
        } catch (error) {
            if (req?.file?.path) await unlinkAsync(req.file.path);
            res.status(400).json({ error: error?.message });
        }
    }

    // [PATCH] /sliders/:sliderId
    async setSliderActive(req, res) {
        try {
            const sliderId = req.params.sliderId;
            const active = req.body?.active;
            if (active == undefined) throw new Error('Active is missing');
            const existedSlider = await Slider.findById(sliderId);
            if (!existedSlider) throw new Error('Slider not found');
            existedSlider.active = active;
            await existedSlider.save();
            res.status(200).json({
                message: 'Update slider successfully!',
                slider: existedSlider,
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [DELETE] /sliders/:sliderId
    async deleteSlider(req, res) {
        try {
            const sliderId = req.params.sliderId;
            const existedSlider = await Slider.findById(sliderId);
            if (!existedSlider) throw new Error('Slider not found');
            if (existedSlider.image) await unlinkAsync(existedSlider.image);
            await existedSlider.deleteOne();
            res.status(200).json({
                message: 'Delete slider successfully!',
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new SliderController();
