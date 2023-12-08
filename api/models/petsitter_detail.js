const mongoose = require('mongoose')

const PetSitterSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    petSitterId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    petPurposeType:{
        type:[{
            type: String,
            enum: ['boarding', 'house sitting', 'drop in visit', 'pet day care', 'pet walking'],
        }],
        required:true
    },
    categoryName:{
        type:[{
            type:String,
            enum: ['animals', 'reptiles', 'birds', 'domesticated animals', 'exotic animals'],
        }],
        required:true
    },
    pet_size:{
        type:[{
            type:String,
            enum: ['small', 'medium', 'large', 'giant'],
        }],
        required:true
    },
    location:{
        type:{
            type:String,
            required:true
        },
        coordinates:[]
    },
    age:{
        type:String,
        required:true
    },
    about:{
        type:String,
    },
    gender:{
        type:String,
        enum:['male', 'female'],
        required:true
    },
    images:{
        type:Array,
    }
    
})

PetSitterSchema.index({location:'2dsphere'})
module.exports = mongoose.model('PetSitterDetails',PetSitterSchema)