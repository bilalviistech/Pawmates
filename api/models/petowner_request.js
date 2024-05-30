const mongoose = require('mongoose')

const PetOwnerRequestSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    pet_id:{
        type:String,
        required:true
    },
    pet_owner_sender_id:{
        type:String,
        required:true
    },
    receive_sitter_id:{
        type:String,
        required:true
    },
    pet_service: {
        type: String,
        required: true
    },
    start_date: {
        type: String,
        required: true 
    },
    end_date: {
        type: String,
        required: true 
    },
    pet_owner_request_send:{
        type:String,
        required:true,
        default:"send"
    },
    pet_sitter_accept_status:{
        type:String,
        required:true,
        enum:['pending','accept','reject'],
        default:"pending"
    }
})

module.exports = mongoose.model('PetOwnerRequest',PetOwnerRequestSchema)