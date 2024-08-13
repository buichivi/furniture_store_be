const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const InspirationItem = new Schema({
    image: { type: String, required: true },
    items: [
        {
            x: Number,
            y: Number,
            product: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
        },
    ],
});

const RoomSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: false },
        slug: { type: String, slug: 'name', unique: true },
        inspirations: [InspirationItem],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Room', RoomSchema);
