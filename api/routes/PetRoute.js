const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const user = require('../models/user.js')
const pet = require('../models/pet.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const OTP = require ("../models/opt.js")
const nodemailer = require ('nodemailer')
const dotenv = require('dotenv').config({ path: '../../.env' });
const auth = require('../../middlewares/auth-middleware.js')
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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
        const existingUser = await user.findOne({ _id: req.body.user_id });
        if (!existingUser) 
        {
            res.status(404).json
            ({
                message: "User not found."
            });
        }
        else
        {
            const images = req.files.map(file => file.path);
            
            const newPet = new pet({
                _id: new mongoose.Types.ObjectId(),
                user_id:req.body.user_id,
                dob: req.body.dob,
                cat_name : req.body.cat_name,
                pet_name : req.body.pet_name,
                gender: req.body.gender,
                breed : req.body.breed,
                age : req.body.age,
                images : images,
                
            });

            await newPet.save();

            res.status(201).json({
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
router.use('/search-pet',auth)
router.get('/search-pet', async (req, res, next) => {
    try 
    {
        const { cat_name, pet_name } = req.body;
        const existingPets = await pet.find({ cat_name, pet_name });
      
        if (existingPets.length === 0)
        {
            return res.status(404).json({
                message: "No pets found."
            });
        }
  
        // Return the found pets
        res.status(200).json(existingPets);
    } 
    
    catch (err) 
    {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router