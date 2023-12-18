const mongoose = require('mongoose')

const FavoriteSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    petId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet', // Reference to the User model
        required: true
    },
    petOwner_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet', // Reference to the User model
        required: true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
})

module.exports = mongoose.model('Favorite',FavoriteSchema)