const Brand = require('../../models/Brand');
const Joi = require('joi');

const createBrandSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    active: Joi.boolean().default(true),
});

const editBrandSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    active: Joi.boolean().allow(null),
});

class BrandController {
    // [GET] /brands/
    async getAllBrands(req, res) {
        const brands = await Brand.find();
        res.status(200).json({ brands });
    }

    // [POST] /brands/
    async createBrand(req, res) {
        const { error, value } = createBrandSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        try {
            const existedBrand = await Brand.findOne({ name: value.name });
            if (existedBrand) {
                throw new Error('This brand name is already in use');
            }
            const newBrand = new Brand(value);
            await newBrand.save();
            res.status(201).json({
                message: 'Created a brand successfully!',
                brand: newBrand,
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [PATCH] /brands/:id
    async toggleActiveBrandById(req, res) {
        const brandId = req.params.id;
        const active = req.body.active;
        Brand.findByIdAndUpdate(brandId, { active }, { new: true })
            .then((brand) =>
                res.status(200).json({
                    message: 'Update brand status successfully',
                    brand,
                })
            )
            .catch((error) => res.status(400).json({ error: error?.message }));
    }

    // [PUT] /brands/:id
    async editBrandById(req, res) {
        const brandId = req.params.id;
        const { error, value } = editBrandSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        Brand.findByIdAndUpdate(brandId, { ...value }, { new: true })
            .then((brand) =>
                res.status(200).json({
                    message: 'Update brand successfully',
                    brand,
                })
            )
            .catch((error) => res.status(400).json({ error: error?.message }));
    }

    // [DELETE] /brands/:id
    async deleteBrandById(req, res) {
        const brandId = req.params.id;
        Brand.findByIdAndDelete(brandId)
            .then(() =>
                res
                    .status(200)
                    .json({ message: 'Deleted a brand successfully' })
            )
            .catch((error) => res.status(400).json({ error: error?.message }));
    }
}

module.exports = new BrandController();
