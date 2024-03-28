const mongoose = require('mongoose')

const ScheduleSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    petSitterId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    date:{
        type: String,
        required: true
    },
    dayOff:{
        type: Boolean,
        required: true
    },
    services:{
        type: Array,
        required: true
    }
})

module.exports = mongoose.model('Schedule', ScheduleSchema)