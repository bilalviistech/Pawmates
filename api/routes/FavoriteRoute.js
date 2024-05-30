const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const user = require('../models/user.js')
const petsitterdetail = require('../models/petsitter_detail.js')
const favorite = require('../models/favorite.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
// const OTP = require ("../models/opt.js")
const nodemailer = require ('nodemailer')
const dotenv = require('dotenv').config({ path: '../../.env' });
const auth = require('../../middlewares/auth-middleware.js')
const multer = require('multer');
const pet = require('../models/pet.js')

router.use('/add-favorite',auth)
router.post('/add-favorite',async (req,res,next)=>{

    const findUser = await user.findOne(req.user._id)
    const {petId, petOwner_id} = req.body;
    try {
        const favoriteExist = await favorite.findOne({userId: findUser._id, petId: petId})
        if(favoriteExist){
            res.status(200).json({
                success: false,
                message: "This pet is already in your favourites."
            })
        }
        else{
            const newFavorite = new favorite({
                _id: new mongoose.Types.ObjectId(),
                petId: petId,
                petOwner_id: petOwner_id,
                userId:findUser._id
            })
    
            await newFavorite.save();
    
            res.status(200).json({
                success:true,
                message:"Added To Favorite Pet's."
            })
        }
    } 
    
    catch (error) {
        console.log(error)
        res.status(200).json({
            success:false,
            message:error.message
        })
    }
})

router.use('/allMy-favorite',auth)
router.get('/allMy-favorite',async (req,res,next)=>{

    const allMy_favorite = await favorite.find({userId:req.user._id})

    try 
    {
        if(allMy_favorite.length > 0)
        {
            let pet_ref = [];
            for(i=0; i<allMy_favorite.length; i++){
                const petDetails = await pet.find({_id:allMy_favorite[i].petId},{_id:1,pet_descp:1,images:1,age:1,
                    pet_nickname:1})

                if (petDetails.length > 0) {
                    pet_ref.push({
                        _id:allMy_favorite[i]._id,
                        petId: allMy_favorite[i].petId,
                        petOwnerId: allMy_favorite[i].petOwner_id,
                        userId: allMy_favorite[i].userId,
                        petDetail: petDetails
                    });
                }
            }

            if(pet_ref.length > 0)
            {
                var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/';
                res.status(200).json({
                    success: true,
                    path:fullUrl,
                    data: pet_ref
                });
            }
            
            else
            {
                res.status(200).json({
                    success: false,
                    message: "No Pet Details Found."
                });
            }
        }

        else
        {
            res.status(200).json({
                success:false,
                message:"No Favorite Pet's Found."
            })
        }
    } 
    
    catch (error) {
        console.log(error)
        res.status(200).json({
            success:false,
            message:error.message
        })
    }
})

module.exports = router