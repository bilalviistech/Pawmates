const mongoose = require('mongoose')

const petSitterScheduleSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    otpCode:{
        type: Number,
        required: true
    },
})

module.exports = mongoose.model('PetSitterSchedule', petSitterScheduleSchema)