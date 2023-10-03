const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const user = require('../models/user.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const OTP = require ("../models/opt.js")
const nodemailer = require ('nodemailer')
const dotenv = require('dotenv').config({ path: '../../.env' });
const auth = require('../../middlewares/auth-middleware.js')

// User Created
router.post('/register',async (req,res,next)=>{

    const check_email = req.body.email
    try 
    {
        const existingUser = await user.findOne({ email: check_email });
        if (existingUser) 
        {
            res.status(201).json({
                message: "Email Already Exists."
            });
        }
        else
        {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(req.body.password, salt);

            const newUser = new user({
                _id: new mongoose.Types.ObjectId(),
                name: req.body.name,
                email: req.body.email,
                password: hash,
                user_type: req.body.user_type
            });

            await newUser.save();

            res.status(201).json({
                message: "User Created"
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err
        });
    }
})

// User Log In
router.post('/login', (req,res,next)=>{
    user.find({email:req.body.email})
    .exec()
    .then(user=>{
        if(user.length < 1){
            return res.status(401).json({
                message: "User Not Found"
            })
        }
        bcrypt.compare(req.body.password,user[0].password,(err,result)=>{
            if(result)
            {
                const token = jwt.sign({
                    id:user[0]._id,
                    name:user[0].name,
                    email:user[0].email,
                    user_type:user[0].user_type
                },
                
                "bafhsd7asu45TX0dbsa8dy98wsdj98",{
                    expiresIn:"24h"
                })
                res.status(200).json({
                    id:user[0].id,
                    name:user[0].name,
                    email:user[0].email,
                    user_type:user[0].user_type,
                    token:token
                });
            }
            else{
                return res.status(401).json({
                    msg:"Password Doesn't Macth"
                })
            }
        })
    })
    .catch(err=>{
        res.status(501).json({
            error:err
        })
    })
})

// User Change Password Using Auth Token
router.use('/change-password',auth)
router.post('/change-password', async (req,res,next)=>{
    const {password} = req.body
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    if(!hash){
        res.status(404).json({
            message: "Password Field Must Be Added"
        })
    }
    else{
        await user.findByIdAndUpdate(req.user._id,
            {
                $set:{password:hash}
            })
        res.status(200).json({
            message: "Password Has Been Changed"
        })
    }
})

// User Verification Code Sent To Email
router.post('/email-verification', async (req, res) => {
    const { email } = req.body;
    
    if (email) {
        const user_email = await user.findOne({ email: email })
        if (user_email) {
            const otp = Math.floor(10000 + Math.random() * 90000);
            // Store the OTP in the database
            const otpData = new OTP({
                userId: user_email._id,
                otpCode: otp,
            });
            
            await otpData.save();
            // Send the OTP via email
            const transporter = nodemailer.createTransport({
                service: 'Gmail', // E.g., 'Gmail', 'Yahoo', etc.
                auth: {
                    user: 'visstechapps@gmail.com',
                    pass: 'bomuubtkvclgvacn',
                },
            });
            
            const mailOptions = {
                from: 'visstechapps@gmail.com',
                to: email,
                subject: 'Password Reset OTP',
                text: `Your OTP For Password Reset Is: ${otp}`,
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(error);
                    res.send({ 
                        status: 'Failed',
                        message: 'Failed To Send OTP'
                    });
                } else {
                    console.log('Email sent: ' + info.response);
                    res.send({
                        status: 'Success',
                        message: 'OTP Sent Successfully',
                        id : user_email?._id,
                        "OTP Code" : otp
                    });
                }
            });

        } else {
            res.send({
                "status": "Failed",
                "message": "Email Does Not Exist"
            })

        }
    } else {
        res.send({
            "status": "Failed",
            "message": "Please Enter Your Correct Email"
        })

    }
})

// Otp Verify
router.post('/verify-otp',async (req,res,next)=>{
    const {otp, id} = req.body;

    const otpData = await OTP.findOne({ userId: id, otpCode: otp });

        if(otpData){
            res.send({"success": true,
            "message": "Otp Verified Successfully"
        })
        }
        
        else{
            res.send({"success": false,
            "message": "Invalid Otp"
        })

        }
})

module.exports = router