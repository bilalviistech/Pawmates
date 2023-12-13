const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const user = require('../models/user.js')
const pet = require('../models/pet.js')
const petrequest = require('../models/petrequest.js')
const petsitterdetail = require('../models/petsitter_detail.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const OTP = require ("../models/opt.js")
const nodemailer = require ('nodemailer')
const dotenv = require('dotenv').config({ path: '../../.env' });
const auth = require('../../middlewares/auth-middleware.js')
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Pet Sitter Request Send
router.use('/req-send',auth)
router.post('/req-send', async (req, res, next) => {
    try
    {
        const { pet_id, pet_owner_id, pet_request, pet_request_status } = req.body;
        const pet_request_id = await user.findOne({ _id: req.user._id });
        const existingRequest = await petrequest.findOne({ pet_id : pet_id });

        if (existingRequest)
        {
            const existtt = existingRequest.pet_request.some(item => item.pet_request_senderid.toString() === pet_request_id._id.toString());
            if(existtt) {
                res.status(200).json({
                    success: false,
                    message: 'Request Already Exist.'
                });
            }

            else
            {
                var pet_sitter_detail = await petsitterdetail.findOne({petSitterId:pet_request_id._id})
                // console.log(pet_sitter_detail)
                // return
                // If it exists, update the existing record by appending the new pet_request_id
                await petrequest.findByIdAndUpdate(existingRequest._id, {
                    $push: 
                    { 
                        pet_request: 
                        {
                            pet_request_senderid:pet_request_id,
                            senderid_name:pet_sitter_detail.name,
                            senderid_age:pet_sitter_detail.age,
                            senderid_images:pet_sitter_detail.images,
                            senderid_location:pet_sitter_detail.location,
                            pet_request_send:pet_request_status,
                            pet_owner_accept_status:"pending"
                        } 
                    }
                });
                
                res.status(200).json({
                    success: true,
                    message: 'Request Created Successfully.'
                });
            }
        }
        
        else
        {
            var pet_sitter_detail = await petsitterdetail.findOne({petSitterId:pet_request_id._id})
            // console.log(pet_siiterdear)
            // return
            const newRequest = new petrequest({
                _id: new mongoose.Types.ObjectId(),
                pet_id: pet_id,
                pet_owner_id: pet_owner_id,
                pet_request: [
                    {
                        pet_request_senderid:pet_request_id,
                        senderid_name:pet_sitter_detail.name,
                        senderid_age:pet_sitter_detail.age,
                        senderid_images:pet_sitter_detail.images,
                        senderid_location:pet_sitter_detail.location,
                        pet_request_send:pet_request_status,
                        pet_owner_accept_status:"pending"
                    }
                ],
            });
            await newRequest.save();

            res.status(200).json({
                success: true,
                message: 'Request Created Successfully.'
            });
        }
    }
    
    catch (err) {
        console.error(err);
        res.status(200).json({
            success:false,
            message: err.message
        });
    }
});

// Request Info By Pet-ID
router.use('/petinfo_petid',auth)
router.get('/petinfo_petid', async(req,res,next)=>{
    
    try {
        const {petId} = req.body;
        
        const checked = await pet.findOne({_id:petId})

        if(checked)
        {
            res.status(200).json({
                success: true,
                data: checked
            });
        }

        else
        {
            res.status(200).json({
                success: false,
                message:"Pet Info Not Found"
            });
        }
    } 
    
    catch (err) {
        res.status(200).json({ 
            success:false,
            message: err.message
         });
    }
    
})

// Request Info By Pet-Owner
router.use('/reqinfo-petowner',auth)
router.get('/reqinfo-petowner', async (req,res,next)=>{
    const reqinfo_petowner = await petrequest.find({ pet_owner_id: req.user._id})
    if(reqinfo_petowner.length > 0)
    {
        res.status(200).json({ 
            success:true,
            data: reqinfo_petowner
        });
    }

    else
    {
        res.status(200).json({ 
            success:false,
            message: "No Request Found For Your Pet's."
        });
    }
})

// Pet Owner Request Accept/Reject Status
router.use('/req-accept-status',auth)
router.post('/req-accept-status', async(req,res,next)=>{
    const pet_owner_status = req.body.pet_owner_accept_status;
    const {pet_request_senderid,petrequest_id} = req.body;
    if(pet_owner_status == "accept")
    {
        try {
            const acceptPetRequest = await petrequest.findOneAndUpdate(
                {
                    _id: petrequest_id,
                    "pet_request.pet_request_senderid": pet_request_senderid
                },
                {
                    $set: { "pet_request.$.pet_owner_accept_status": pet_owner_status }
                },
                { new: true }
            );

            if (acceptPetRequest) {
                res.status(200).json({
                    success: true,
                    message: `Pet request ${pet_owner_status} successfully.`,
                    data:acceptPetRequest
                });
            } else {
                res.status(200).json({
                    success: false,
                    message: 'Pet request not found.'
                });
            }
        } catch (error) {
            console.error(error);
            res.status(200).json({
                success:false,
                message: error.message
            });
        }
    }

    if(pet_owner_status == "reject")
    {
        try {
            const rejectPetRequest = await petrequest.findOneAndUpdate(
                {
                    _id: petrequest_id,
                    "pet_request.pet_request_senderid": pet_request_senderid
                },
                {
                    $set: { "pet_request.$.pet_owner_accept_status": pet_owner_status }
                },
                { new: true }
            );

            if (rejectPetRequest) {

                const rejectPetRequest_info = await petrequest.findOne({_id:petrequest_id,"pet_request.pet_request_senderid": pet_request_senderid});
                res.status(200).json({
                    success: true,
                    message: `Pet request ${pet_owner_status} successfully.`,
                    data:rejectPetRequest_info
                });
            } else {
                res.status(200).json({
                    success: false,
                    message: 'Pet request not found.'
                });
            }
        } catch (error) {
            console.error(error);
            res.status(200).json({
                success:false,
                message: error.message
            });
        }
    }

})


module.exports = router