const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
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
    pet_add_status:{
        type:Number,
        default:0,
        required:true
    },
    petSitter_update_status:{
        type:Number,
        default:0,
        required:true
    },
})

module.exports = mongoose.model('User',UserSchema)