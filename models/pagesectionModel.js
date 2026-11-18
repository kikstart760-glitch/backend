const mongoose = require('mongoose');

const pagesectionSchema = new mongoose.Schema({
    pageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Page',
        required: true, 
    },
    sectionTitle: {
        type: String,
        required: true,
    },
    sectionSubtitle: {
        type: String,
        required: true,
    },
    sectionDescription: {
        type: String,
        required: true,
    },
    sectionContent: {
        type: String,
        required: true,
    },
    image: string,
    buttonText: {
        type: String,
    },
    buttonLink: {
        type: String,
    }

});

module.exports = mongoose.model('PageSection', pagesectionSchema);