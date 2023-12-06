const mongoose = require('mongoose')

const PetSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    pet_owner_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    pet_nickname:{
        type:String,
        required:true
    },
    pet_purpose_type:{
        enum: ['boarding', 'house sitting', 'drop in visit', 'pet day care', 'pet walking'],
        type:String,
        required:true
    },
    location:{
        type:{
            type:String,
            required:true
        },
        coordinates:[]
    },
    pet_drop_off:{
        type:String,
        required:true
    },
    pet_pick_up:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        enum: ['male', 'female'],
        // minlength: 4,  Minimum length of 3 characters
        // maxlength: 6,
        required:true,
    },
    images:{
        type:Array,
        // required:true
    },
    cat_name:{
        enum: ['animals', 'reptiles', 'birds', 'domesticated animals', 'exotic animals'],
        type:String,
        required:true
    },
    pet_type:{
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
    pet_size:{
        enum: ['small', 'medium', 'large', 'giant'],
        type:String,
        required:true
    },
})

module.exports = mongoose.model('Pet',PetSchema)