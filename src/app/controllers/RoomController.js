const Room = require('../../models/Room');
const getFileUrl = require('../../utils/getFileUrl');
const Joi = require('joi');
const unlinkAsync = require('../../utils/removeImage');

const createRoomSChema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
});

const addInspirationSChema = Joi.object({
    image: Joi.any().required(),
    items: Joi.array().required(),
});

const editInspirationSchema = Joi.object({
    image: Joi.any(),
    items: Joi.array(),
});

class RoomController {
    // [GET] /rooms/
    async getRooms(req, res) {
        const rooms = await Room.find().populate({
            path: 'inspirations.items',
            model: 'Product',
        });
        res.status(200).json({
            rooms: rooms.map((room) => {
                return {
                    ...room._doc,
                    inspirations: room.inspirations.map((inspiration) => {
                        return {
                            ...inspiration._doc,
                            image: getFileUrl(req, inspiration.image),
                        };
                    }),
                };
            }),
        });
    }

    // [POST] /rooms/
    async createRoom(req, res) {
        try {
            const { error, value } = createRoomSChema.validate(req.body);
            if (error) throw new Error(error.details[0].message);

            const newRoom = new Room({ ...value, inspirations: [] });
            await newRoom.save();
            return res.status(201).json({
                message: 'Create a new room successfully',
                room: newRoom,
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [POST] /rooms/:slug
    async addInspiration(req, res) {
        try {
            const slug = req.params.slug;
            const room = await Room.findOne({ slug });
            if (!room) throw new Error('Room is not found');
            const { error, value } = addInspirationSChema.validate({
                ...req.body,
                items: JSON.parse(req.body.items),
                image: req?.file ? req.file.path : '',
            });
            if (error) throw new Error(error.details[0].message);
            room.inspirations = [...room.inspirations, { ...value }];
            await room.save();
            return res.status(200).json({
                message: 'Add a new inspiration successfully',
                room: {
                    ...room._doc,
                    inspirations: room.inspirations.map((inspiration) => {
                        return {
                            ...inspiration._doc,
                            image: getFileUrl(req, inspiration.image),
                        };
                    }),
                },
            });
        } catch (error) {
            if (req.file) await unlinkAsync(req.file.path);
            res.status(400).json({ error: error?.message });
        }
    }

    // [GET] /rooms/:slug
    async getRoomBySlug(req, res) {
        try {
            const slug = req.params.slug;
            const existedRoom = await Room.findOne({ slug });
            if (!existedRoom) throw new Error('Room not found');
            return res.status(200).json({
                room: {
                    ...existedRoom._doc,
                    inspirations: existedRoom.inspirations.map(
                        (inspiration) => {
                            return {
                                ...inspiration._doc,
                                image: getFileUrl(req, inspiration.image),
                            };
                        }
                    ),
                },
            });
        } catch (err) {
            res.status(400).json({ error: err?.message });
        }
    }

    // [PUT] /rooms/:slug/inspiration/:id
    async editInspiration(req, res) {
        try {
            const slug = req.params.slug;
            const id = req.params.id;
            const room = await Room.findOne({ slug });
            if (!room) throw new Error('Room not found');
            const { error, value } = editInspirationSchema.validate({
                ...req.body,
                image: req?.file ? req.file.path : '',
                item: JSON.parse(req.body.items),
            });
            if (error) throw new Error(error.details[0].message);
        } catch (err) {
            res.status(400).json({ error: err?.message });
        }
    }
}

module.exports = new RoomController();
