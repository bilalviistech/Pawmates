const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    gender:String,
    first_name:String,
    last_name:String,
    lat:String,
    long:String,
    age:String,
    about:String,
    images:{
        type:Array,
        // required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    user_type:{
        enum: ['pet owner', 'pet sitter'],
        type:String,
        required:true
    },
})

module.exports = mongoose.model('User',UserSchema)