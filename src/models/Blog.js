const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

const BlogSchema = new Schema(
    {
        title: { type: String, required: true, unique: true },
        slug: { type: String, slug: 'title', unique: true },
        description: { type: String, required: true },
        tags: [{ type: Schema.Types.ObjectId, ref: 'Tag', required: true }],
        thumb: { type: String, required: true },
        post: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Blog', BlogSchema);
