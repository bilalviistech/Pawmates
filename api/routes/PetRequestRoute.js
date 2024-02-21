const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const user = require('../models/user.js')
const pet = require('../models/pet.js')
const petrequest = require('../models/petrequest.js')
const petsitterdetail = require('../models/petsitter_detail.js')
const petowner_request = require('../models/petowner_request.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const OTP = require("../models/opt.js")
const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config({ path: '../../.env' });
const auth = require('../../middlewares/auth-middleware.js')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const petsitter_detail = require('../models/petsitter_detail.js')

// Pet Sitter Request Send
router.use('/req-send', auth)
router.post('/req-send', async (req, res, next) => {
    try {
        const { pet_id, pet_owner_id, pet_request, pet_request_send } = req.body;
        const existing_request = await petrequest.findOne({ pet_request_senderid: req.user._id, pet_id: pet_id })

        if (existing_request) {
            res.status(200).json({
                success: false,
                message: "Request Already Sent."
            });
        }

        else {
            const senderuser_exists = await user.findOne(req.user._id)
            const senderuser_detail = await petsitter_detail.findOne({ petSitterId: senderuser_exists._id })

            const pet_detail = await pet.findOne({ _id: pet_id })

            const newPet_Req = new petrequest({
                _id: new mongoose.Types.ObjectId(),
                pet_owner_id: pet_owner_id,
                pet_id: pet_id,
                pet_request_senderid: req.user._id,
                senderid_name: senderuser_exists.name,
                senderid_age: senderuser_detail.age,
                senderid_location: senderuser_detail.location,
                senderid_images: senderuser_detail.images,
                pet_name: pet_detail.pet_nickname,
                pet_images: pet_detail.images,
                pet_request_send: pet_request_send,
                pet_owner_accept_status: "pending"
            });

            await newPet_Req.save();

            res.status(200).json({
                success: true,
                message: "Request Sent Successfully."
            });

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

// Pet Owner Request Send
router.use('/owner-req-send', auth)
router.post('/owner-req-send', async (req, res, next) => {
    try {
        const petId = req.body.pet_id
        const SitterId = req.body.receive_sitter_id

        const existOwner_request = await petowner_request.findOne({ pet_id: petId, receive_sitter_id: SitterId })

        if (existOwner_request) {
            // console.log("if")
            // return
            res.status(200).json({
                success: false,
                message: "Request Already Sent."
            });
        }

        else {
            // console.log("else")
            // return
            const petOwnerReq = new petowner_request({
                _id: new mongoose.Types.ObjectId(),
                pet_id:petId,
                pet_owner_sender_id:req.user._id,
                receive_sitter_id:SitterId
            })

            await petOwnerReq.save();

            res.status(200).json({
                success: true,
                message: "Request Sent Successfully."
            });

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

// Request Info By Pet-Owner
router.use('/reqinfo-petowner', auth)
router.get('/reqinfo-petowner', async (req, res, next) => {
    const reqinfo_petowner = await petrequest.find({ pet_owner_id: req.user._id })
    if (reqinfo_petowner.length > 0) {
        res.status(200).json({
            success: true,
            data: reqinfo_petowner
        });
    }

    else {
        res.status(200).json({
            success: false,
            message: "No Request Found For Your Pet's."
        });
    }
})

// Request Info By Pet-Sitter
router.use('/reqinfo-petsitter', auth)
router.get('/reqinfo-petsitter', async (req, res, next) => {
    const reqinfo_petsitter = await petowner_request.find({ receive_sitter_id: req.user._id })
    if (reqinfo_petsitter.length > 0) {
        const PetAllDetail = []
        for(var i=0; i<reqinfo_petsitter.length; i++)
        {
            const PetInfo = await pet.findOne({_id:reqinfo_petsitter[i].pet_id})
            const UserInfo = await user.findOne({_id:reqinfo_petsitter[i].pet_owner_sender_id})

            PetAllDetail.push({
                _id:reqinfo_petsitter[i]._id,
                pet_id:reqinfo_petsitter[i].pet_id,
                pet_nickname:PetInfo.pet_nickname,
                pet_age:PetInfo.age,
                pet_images:PetInfo.images,
                pet_size:PetInfo.pet_size,
                pet_purpose_type:PetInfo.pet_purpose_type,
                pet_owner_sender_id:reqinfo_petsitter[i].pet_owner_sender_id,
                pet_owner_name:UserInfo.name,
                receive_sitter_id:reqinfo_petsitter[i].receive_sitter_id,
                pet_owner_request_send:reqinfo_petsitter[i].pet_owner_request_send,
                pet_sitter_accept_status:reqinfo_petsitter[i].pet_sitter_accept_status,
                __v:reqinfo_petsitter[i].__v,
            })
        }
        res.status(200).json({
            success: true,
            data: PetAllDetail
        });
    }

    else {
        res.status(200).json({
            success: false,
            message: "No Request Found Of Pet Owner's."
        });
    }
})

// Pet Owner Request Accept/Reject Status
router.use('/req-accept-status', auth)
router.post('/req-accept-status', async (req, res, next) => {
    const pet_owner_status = req.body.pet_owner_accept_status;
    const petrequest_id = req.body.petrequest_id;
    try {
        if (pet_owner_status == "accept") {
            var petRequest_update = await petrequest.findOneAndUpdate({ _id: petrequest_id, pet_owner_id:req.user._id },
                { $set: { pet_owner_accept_status: pet_owner_status } }
            )

            if (petRequest_update) {
                res.status(200).json({
                    success: true,
                    message: "Accept Pet Request."
                });
            }

            else {
                res.status(200).json({
                    success: false,
                    message: "No Pet Request Found."
                });
            }
        }

        else if (pet_owner_status == "reject") {
            var petRequest_update = await petrequest.findOneAndUpdate({ _id: petrequest_id, pet_owner_id:req.user._id },
                { $set: { pet_owner_accept_status: pet_owner_status } }
            )

            if (petRequest_update) {
                res.status(200).json({
                    success: true,
                    message: "Reject Pet Request."
                });
            }

            else {
                res.status(200).json({
                    success: false,
                    message: "No Pet Request Found."
                });
            }
        }

        else {
            res.status(200).json({
                success: false,
                message: "You Must Select Accept Or Reject."
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

// Pet Sitter Request Accept/Reject Status
router.use('/sitter-req-accept-status', auth)
router.post('/sitter-req-accept-status', async (req, res, next) => {
    const pet_sitter_status = req.body.pet_sitter_accept_status;
    const petownerrequest_id = req.body.petownerrequest_id;
    try {
        if (pet_sitter_status == "accept") {
            var ownerRequest_update = await petowner_request.findOneAndUpdate({ _id: petownerrequest_id, receive_sitter_id:req.user._id },
                { $set: { pet_sitter_accept_status: pet_sitter_status } }
            )

            if (ownerRequest_update) {    
                res.status(200).json({
                    success: true,
                    message: "Accept Pet Owner Request."
                });
            }

            else {
                res.status(200).json({
                    success: false,
                    message: "No Pet Owner Request Found."
                });
            }
        }

        else if (pet_sitter_status == "reject") {
            var ownerRequest_update = await petowner_request.findOneAndUpdate({ _id: petownerrequest_id, receive_sitter_id:req.user._id },
                { $set: { pet_sitter_accept_status: pet_sitter_status } }
            )

            if (ownerRequest_update) {
                res.status(200).json({
                    success: true,
                    message: "Reject Pet Owner Request."
                });
            }

            else {
                res.status(200).json({
                    success: false,
                    message: "No Pet Owner Request Found."
                });
            }
        }

        else {
            res.status(200).json({
                success: false,
                message: "You Must Select Accept Or Reject."
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


module.exports = router