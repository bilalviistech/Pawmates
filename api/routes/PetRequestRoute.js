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
                    success: true,
                    message: 'Request Already Exist.'
                });
            }

            else
            {
                // If it exists, update the existing record by appending the new pet_request_id
                await petrequest.findByIdAndUpdate(existingRequest._id, {
                    $push: { pet_request: {pet_request_senderid:pet_request_id,pet_request_send:pet_request_status,pet_owner_accept_status:"pending"} }
                });
                
                res.status(200).json({
                    success: true,
                    message: 'Request Created Successfully.'
                });
            }
        }
        
        else
        {
            const newRequest = new petrequest({
                _id: new mongoose.Types.ObjectId(),
                pet_id: pet_id,
                pet_owner_id: pet_owner_id,
                pet_request: [{pet_request_senderid:pet_request_id,pet_request_send:pet_request_status,pet_owner_accept_status:"pending"}],
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

router.use('/reqinfo_petid',auth)
router.get('/reqinfo_petid', async(req,res,next)=>{
    
    try {
        const {petId,petOwner_Id} = req.body;
        
        const checked = await petrequest.findOne({pet_id:petId,pet_owner_id:petOwner_Id})

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
                message:"Info Not Found"
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