const mongoose = require('mongoose')

const GallerySchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    petSitterId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    imagesGallery:{
        type:Array,
        required:true
    },
})

module.exports = mongoose.model('Gallery',GallerySchema)