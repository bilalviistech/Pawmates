const mongoose = require('mongoose')

const PetRequestSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    pet_owner_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    pet_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet', // Reference to the User model
        required: true
    },
    // id: mongoose.Schema.Types.ObjectId,
    pet_request_senderid: {
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    senderid_age:{
        type:String,
        required:true
    },
    senderid_name:{
        type:String,
        required:true
    },
    senderid_location:{
        type:{
            type:String,
            required:true
        },
        coordinates:[]
    },

    senderid_images:{
        type:Array
    },
    pet_request_send: {
        enum:["send","not interested"],
        type:String,
        required:true
    },
    pet_owner_accept_status:{
        type:String,
        required:true,
        enum:["accept","reject","pending"]
    },
    pet_name:{
        required:true,
        type:String
    },
    pet_images:{
        type:Array
    }
        
})

module.exports = mongoose.model('PetRequest',PetRequestSchema)