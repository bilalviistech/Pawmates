const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const user = require('../models/user.js')
const pet = require('../models/pet.js')
const petrequest = require('../models/petrequest.js')
const petsitterdetail = require('../models/petsitter_detail.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
// const OTP = require("../models/opt.js")
const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config({ path: '../../.env' });
const auth = require('../../middlewares/auth-middleware.js')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const petsitter_detail = require('../models/petsitter_detail.js')

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
router.use('/add-pet', auth)
router.post('/add-pet', upload.array('images', 5), async (req, res, next) => {
    try {
        const existingUser = await user.findOne({ _id: req.user._id });
        if (!existingUser) {
            res.status(200).json
                ({
                    success: false,
                    message: "User not found."
                });
        }
        else {
            const images = req.files.map(file => file.path);

            const newPet = new pet({
                _id: new mongoose.Types.ObjectId(),
                pet_owner_id: existingUser._id,
                cat_name: req.body.cat_name,
                pet_type: req.body.pet_type,
                pet_nickname: req.body.pet_nickname,
                pet_purpose_type: req.body.pet_purpose_type,
                location: {
                    type: "Point",
                    coordinates: [
                        parseFloat(req.body.longitude),
                        parseFloat(req.body.latitude)
                    ]
                },
                pet_drop_off: req.body.pet_drop_off,
                pet_pick_up: req.body.pet_pick_up,
                pet_size: req.body.pet_size,
                gender: req.body.gender,
                breed: req.body.breed,
                age: req.body.age,
                pet_descp : req.body.pet_descp,
                images: images,

            });

            await newPet.save();

            if (newPet) {
                await user.findByIdAndUpdate(newPet.pet_owner_id, {
                    $set: { pet_add_status: 1 }
                })
            }

            res.status(200).json({
                success: true,
                message: "Pet Added Successfully."
            });
        }
    }

    catch (err) {
        console.error(err);
        res.status(200).json({
            // error: err._message
            success: false,
            message: err.message
        });
    }
})

// Get All Pet
router.use('/getall-pet', auth)
router.get('/getall-pet', async (req, res, next) => {
    var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/';
    console.log(req.user._id);
    const petSitter_reqExist = await petrequest.find({ pet_request_senderid: req.user._id })
    if(petSitter_reqExist)
    {
        const petIds = petSitter_reqExist.map(req => req.pet_id);
        let check_pet = await pet.find({ _id: { $nin : petIds } });

        if (check_pet.length > 0) {
            res.status(200).json({
                success: true,
                path:fullUrl,
                data:check_pet
            })
        } else {
            res.status(200).json({
                success: false,
                message: 'No pets found.'
            })
        }
    }

    else
    {
        let check_pet = await pet.find();
        res.status(200).json({
            success: true,
            path:fullUrl,
            data:check_pet
        })
    }

})

// Get All My Pet
router.use('/getall-Mypet', auth)
router.get('/getall-Mypet', async (req, res, next) => {
    var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/';
    const allMyPet = await pet.find({ pet_owner_id: req.user._id })

    if (allMyPet.length > 0) {
        res.status(200).json({
            success: true,
            path: fullUrl,
            data: allMyPet
        })
    }
    else {
        res.status(200).json({
            success: false,
            message: "No Ads."
        })
    }
})

// Request Info By Pet-ID
router.use('/petinfo_petid', auth)
router.get('/petinfo_petid', async (req, res, next) => {

    try {
        const { petId } = req.body;

        const checked = await pet.findOne({ _id: petId })

        if (checked) {
            res.status(200).json({
                success: true,
                data: checked
            });
        }

        else {
            res.status(200).json({
                success: false,
                message: "Pet Info Not Found"
            });
        }
    }

    catch (err) {
        res.status(200).json({
            success: false,
            message: err.message
        });
    }

})

// Search Pet
router.use('/search-pet', auth)
router.get('/search-pet', async (req, res, next) => {
    const { category_name, pet_name_type, pet_purpose_type } = req.body;
    if (category_name && pet_name_type && pet_purpose_type) {
        var search_pet = await pet.find({ cat_name: category_name, pet_type: pet_name_type, pet_purpose_type: pet_purpose_type })
        if (search_pet.length > 0) {
            var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/';
            res.status(200).json({
                success: true,
                path: fullUrl,
                data: search_pet
            })
        }

        else {
            res.status(200).json({
                success: false,
                message: "No Pets Found."
            })
        }
    }

    else if (category_name && pet_name_type) {
        var search_pet = await pet.find({ cat_name: category_name, pet_type: pet_name_type })
        if (search_pet.length > 0) {
            var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/';
            res.status(200).json({
                success: true,
                path: fullUrl,
                data: search_pet
            })
        }

        else {
            res.status(200).json({
                success: false,
                message: "No Pets Found."
            })
        }
    }

    else if (category_name) {
        var search_pet = await pet.find({ cat_name: category_name })
        if (search_pet.length > 0) {
            var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/';
            res.status(200).json({
                success: true,
                path: fullUrl,
                data: search_pet
            })
        }

        else {
            res.status(200).json({
                success: false,
                message: "No Pets Found."
            })
        }
    }

    else if (pet_name_type || pet_purpose_type) {
        var search_pet = await pet.find({ $or: [{ cat_name: category_name }, { pet_type: pet_name_type }, { pet_purpose_type: pet_purpose_type }] })
        if (search_pet.length > 0) {
            var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/';
            res.status(200).json({
                success: true,
                path: fullUrl,
                data: search_pet
            })
        }

        else {
            res.status(200).json({
                success: false,
                message: "No Pets Found."
            })
        }
    }
})

// Search Pet Sitter
router.use('/search-pet-sitter', auth)
router.get('/search-pet-sitter', async (req, res, next) => {
    try {
        const latitude = req.body.latitude;
        const longitude = req.body.longitude;
        const pet_category = req.body.pet_category;
        const pet_service = req.body.pet_service;
        const sitter_detaill = await petsitterdetail.find({ petPurposeType: pet_service, categoryName: pet_category })
        var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/';
        if (sitter_detaill.length > 0) 
        {
            res.status(200).json({
                success: true,
                data: sitter_detaill
            })

            // const location = await petsitterdetail.aggregate([
            //     {
            //         $geoNear: {
            //             near: {
            //                 type: "Point",
            //                 coordinates: [parseFloat(longitude), parseFloat(latitude)]
            //             },
            //             key: "location",
            //             maxDistance: parseFloat(0.8) * 1609,
            //             distanceField: "dist.calculated",
            //             spherical: true
            //         }
            //     },
            //     {
            //         $match: {
            //             _id: { $in: sitter_detaill.map(sitter => sitter._id) }
            //         }
            //     }
            // ])

            // if (location.length == 0) {
            //     res.status(200).json({
            //         success: true,
            //         message: "No Nearest Pet Sitter Found."
            //     })
            // }
            // else {
            //     res.status(200).json({
            //         success: true,
            //         path: fullUrl,
            //         message: location
            //     })
            // }
        }

        else {
            res.status(200).json({
                success: false,
                message: "No Pet Sitter Found."
            })
        }
    }

    catch (err) {
        console.error(err);
        res.status(200).json({
            success: false,
            message: err.message
        });
    }
});

router.use('/check-api', auth)
router.post('/check-api',async (req,res,next)=>{

    const check_pet_category = req.body.pet_category;
    const check_pet_service = req.body.pet_service;
    
    const sitter_detail = await petsitter_detail.find({categoryName:check_pet_category, petPurposeType:check_pet_service})

    if(sitter_detail.length > 0)
    {
        res.status(200).json({
            success:true,
            data:sitter_detail
        })
    }

    else
    {
        res.status(200).json({
            success:false,
            message:"No Pet Sitter Found."
        })
    }
    
})

module.exports = router