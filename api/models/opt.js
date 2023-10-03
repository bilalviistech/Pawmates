const mongoose = require('mongoose')

const OptSchema = new mongoose.Schema({
    // _id:mongoose.Schema.Types.ObjectId,
    userId:String,
    otpCode:String,
})

module.exports = mongoose.model('Opt',OptSchema)