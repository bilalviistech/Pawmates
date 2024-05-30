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
// const OTP = require("../models/opt.js")
const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config({ path: '../../.env' });
const auth = require('../../middlewares/auth-middleware.js')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const petsitter_detail = require('../models/petsitter_detail.js')
const schedule = require('../models/schedule.js')
const moment = require('moment');

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
        const {pet_id, receive_sitter_id, start_date, end_date, pet_service} = req.body

        const existOwner_request = await petowner_request.findOne({ pet_id: pet_id, receive_sitter_id: receive_sitter_id })

        if (existOwner_request) {
            res.status(200).json({
                success: false,
                message: "Request Already Sent."
            });
        }

        else {
            const datesInRange = [];
            let startDate = moment(start_date).clone();
            
            while (startDate.isSameOrBefore(moment(end_date), 'day')) {
                datesInRange.push(startDate.format('YYYY-MM-DD'));
                startDate.add(1, 'day');
            }

            const SitterSchedule = await schedule.find({petSitterId: receive_sitter_id})

            if(SitterSchedule.length > 0){
                let index = -1; // Default value if no match is found
                // console.log(index)
                for (let i = 0; i < datesInRange.length; i++) {
                    const date = datesInRange[i];
                    const foundIndex = SitterSchedule.findIndex(schedule => schedule.date === date && schedule.dayOff === true);
                    if (foundIndex === 0) {
                        index = 0;
                        break; // Break the loop if a match is found
                    }
                }
                if(index === 0){
                    res.status(200).json({
                        success: false,
                        message: "Pet sitter has taken a few days off in the range you have selected."
                    });
                }
                else{
                    const petOwnerReq = new petowner_request({
                        _id: new mongoose.Types.ObjectId(),
                        pet_id:pet_id,
                        pet_owner_sender_id:req.user._id,
                        receive_sitter_id:receive_sitter_id,
                        pet_service:pet_service,
                        start_date:start_date,
                        end_date:end_date,
                    })
        
                    await petOwnerReq.save();
        
                    res.status(200).json({
                        success: true,
                        message: "Request Sent Successfully."
                    });
                }
            }
            else{
                const petOwnerReq = new petowner_request({
                    _id: new mongoose.Types.ObjectId(),
                    pet_id:pet_id,
                    pet_owner_sender_id:req.user._id,
                    receive_sitter_id:receive_sitter_id,
                    pet_service:pet_service,
                    start_date:start_date,
                    end_date:end_date,
                })
    
                await petOwnerReq.save();
    
                res.status(200).json({
                    success: true,
                    message: "Request Sent Successfully."
                });
            }
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
                pet_service:reqinfo_petsitter[i].pet_service,
                start_date:reqinfo_petsitter[i].start_date,
                end_date:reqinfo_petsitter[i].end_date,
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

router.use('/get-info-booked',auth)
router.get('/get-info-booked', async(req,res,next)=>{
    try {
        const sitter_Id = req.user._id
        
        if(sitter_Id)
        {
            const getInfoBooked = await petowner_request.find({
                $and:[{
                    receive_sitter_id: sitter_Id,
                    pet_sitter_accept_status:'accept' 
                }]
            })
    
            let getInfoBookedArray= []
    
            for(let i=0;i<getInfoBooked.length;i++)
            {
                const petOwnerId = await user.findById(getInfoBooked[i].pet_owner_sender_id)
                const petIdExist = await pet.findById(getInfoBooked[i].pet_id)
    
                getInfoBookedArray.push({
                    ownerId:petOwnerId.name,
                    petImages:petIdExist.images,
                    petDropOoff:petIdExist.pet_drop_off,
                    petPickUp:petIdExist.pet_pick_up,
                    petPurposeType:petIdExist.pet_purpose_type,
                    petType:petIdExist.pet_type,
                    petAge:petIdExist.age,
                })
            }
            res.status(200).json({
                success: true,
                data: getInfoBookedArray
            });
        }
        
        else{
            res.status(200).json({
                success:false,
                message:"User Doesn't Exist."
            })
        }
        
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        }); 
    }
})

     // const indexes = datesInRange.map(date => {
            //     // Find the index of the date in SitterSchedule
            //     const index = SitterSchedule.findIndex(schedule => schedule.date === date);
            //     return index;
            // });

module.exports = router