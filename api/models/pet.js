const mongoose = require('mongoose')

const PetSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true},
    dob:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        // enum: ['male', 'female', 'other'],
        minlength: 4, // Minimum length of 3 characters
        maxlength: 6,
        required:true,
    },
    images:{
        type:Array,
        // required:true
    },
    cat_name:{
        type:String,
        required:true
    },
    pet_name:{
        type:String,
        required:true
    },
    breed:{
        type:String,
        required:true
    },
    age:{
        type:String,
        required:true
    },
})

module.exports = mongoose.model('Pet',PetSchema)