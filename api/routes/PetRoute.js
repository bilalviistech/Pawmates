const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const user = require('../models/user.js')
const pet = require('../models/pet.js')
const petrequest = require('../models/petrequest.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const OTP = require ("../models/opt.js")
const nodemailer = require ('nodemailer')
const dotenv = require('dotenv').config({ path: '../../.env' });
const auth = require('../../middlewares/auth-middleware.js')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
// const basePath = path.resolve(__dirname);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
  // Create multer upload instance
  const upload = multer({ storage: storage });

// Add Pet
router.use('/add-pet',auth)
router.post('/add-pet', upload.array('images', 5),async (req,res,next)=>{
    try 
    {
        const existingUser = await user.findOne({ _id: req.user._id });
        if (!existingUser) 
        {
            res.status(200).json
            ({
                success:"false",
                message: "User not found."
            });
        }
        else
        {
            const images = req.files.map(file => file.path);
            
            const newPet = new pet({
                _id: new mongoose.Types.ObjectId(),
                pet_owner_id:existingUser._id,
                cat_name : req.body.cat_name,
                pet_type : req.body.pet_type,
                pet_nickname : req.body.pet_nickname,
                pet_purpose_type : req.body.pet_purpose_type,
                pet_address : req.body.pet_address,
                pet_drop_off : req.body.pet_drop_off,
                pet_pick_up : req.body.pet_pick_up,
                pet_size : req.body.pet_size,
                gender: req.body.gender,
                breed : req.body.breed,
                age : req.body.age,
                images : images,
                
            });

            await newPet.save();

            res.status(200).json({
                success:"true",
                message: "Pet Added Successfully."
            });
        }
    }
    
    catch (err) {
        console.error(err);
        res.status(500).json({
            error: err
        });
    }
})

//Search Pet
router.use('/seearch-pet',auth)
router.get('/seearch-pet', async (req, res, next) => {
    try 
    {
        const { cat_name, pet_name } = req.body;
        const existingPets = await pet.find({ cat_name, pet_name });
      
        if (existingPets.length === 0)
        {
            return res.status(200).json({
                success:"false",
                message: "No pets found."
            });
        }
  
        // Return the found pets
        res.status(200).json({
            success:"true",
            data :existingPets
        });
    } 
    
    catch (err) 
    {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
});

router.use('/getall-pet',auth)
router.get('/getall-pet', async(req,res,next)=>{
    const allPet = await pet.find()
    res.status(200).json({
        success:true,
        data:allPet
    })
})

router.use('/search-pet',auth)
router.get('/search-pet', async(req,res,next)=>{
    const {category_name,pet_name_type,pet_purpose_type} = req.body;
    if(category_name && pet_name_type && pet_purpose_type)
    {
        var search_pet = await pet.find({cat_name:category_name,pet_type:pet_name_type,pet_purpose_type:pet_purpose_type})
        if(search_pet.length > 0)
        {
            res.status(200).json({
                success:true,
                data:search_pet
            })
        }

        else
        {
            res.status(200).json({
                success:false,
                message:"No Pets Found."
            })
        }
    }

    else if(category_name && pet_name_type)
    {
        var search_pet = await pet.find({cat_name:category_name,pet_type:pet_name_type})
        if(search_pet.length > 0)
        {
            res.status(200).json({
                success:true,
                data:search_pet
            })
        }

        else
        {
            res.status(200).json({
                success:false,
                message:"No Pets Found."
            })
        }
    }

    else if(category_name)
    {
        var search_pet = await pet.find({cat_name:category_name})
        if(search_pet.length > 0)
        {
            res.status(200).json({
                success:true,
                data:search_pet
            })
        }

        else
        {
            res.status(200).json({
                success:false,
                message:"No Pets Found."
            })
        }
    }

    else if(pet_name_type || pet_purpose_type)
    {
        var search_pet = await pet.find({$or: [{ cat_name:category_name }, { pet_type:pet_name_type }, {pet_purpose_type:pet_purpose_type} ]})
        if(search_pet.length > 0)
        {
            res.status(200).json({
                success:true,
                data:search_pet
            })
        }

        else
        {
            res.status(200).json({
                success:false,
                message:"No Pets Found."
            })
        }
    }
})

module.exports = router