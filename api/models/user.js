const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    name:String,
    email:String,
    password:String,
    user_type:String,
})

module.exports = mongoose.model('User',UserSchema)