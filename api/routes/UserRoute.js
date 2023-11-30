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
const multer = require('multer');

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

// User Created
router.post('/register',async (req,res,next)=>{

    const check_email = req.body.email
    try 
    {
        const existingUser = await user.findOne({ email: check_email });
        const {user_type} = req.body;
        if (existingUser) 
        {
            res.status(200).json({
                success:"false",
                message: "Email Already Exists."
            });
        }
        else
        {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(req.body.password, salt);

            const newUser = new user({
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: hash,
                user_type: req.body.user_type,
            });
            await newUser.save();

            res.status(200).json({
                success:"true",
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
            return res.status(200).json({
                success:"false",
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
                return res.status(200).json({
                    success:"false",
                    message:"Password Doesn't Match"
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
router.use('/update-password',auth)
router.post('/update-password', async (req,res,next)=>{
    const {password} = req.body
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);
    if(!hash){
        res.status(200).json({
            success:"false",
            message: "Password Field Must Be Added."
        })
    }
    else{
        await user.findByIdAndUpdate(req.user._id,
            {
                $set:{password:hash}
            })
        res.status(200).json({
            success:"true",
            message: "Password Has Been Changed."
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
                        success:"false",
                        message: 'Failed To Send OTP.'
                    });
                } else {
                    console.log('Email sent: ' + info.response);
                    res.send({
                        success:"true",
                        message: 'OTP Sent Successfully.',
                        id : user_email?._id,
                        "OTP Code" : otp
                    });
                }
            });

        } else {
            res.send({
                success:"false",
                message: "Email Does Not Exist."
            })

        }
    } else {
        res.send({
            success:"false",
            message: "Please Enter Your Correct Email."
        })

    }
})

// Otp Verify
router.post('/verify-otp',async (req,res,next)=>{
    const {otp, id} = req.body;

    const otpData = await OTP.findOne({ userId: id, otpCode: otp });
        if(otpData){
            res.send({
            success: "true",
            message: "Otp Verified Successfully."
        })
        }
        
        else{
            res.send({
            success: "false",
            message: "Invalid Otp."
        })

        }
})

router.post('/change-password',async (req,res,next)=>{
    const {password, id} = req.body
    const saltt = await bcrypt.genSalt(10);
    
    const hashed = await bcrypt.hash(password, saltt);
    if(!hashed){
        res.status(200).json({
            success:"false",
            message: "Password Field Must Be Added."
        })
    }
    else{
        const check = await user.findByIdAndUpdate(id,
            {
                $set:{password:hashed}
            })
        res.status(200).json({
            success:"true",
            message: "Password Has Been Changed."
        })
    }
})

router.use('/update-info',auth)
router.post('/update-info',upload.array('images', 5), async(req,res,next)=>{
    const upadate_user = await user.findById(req.user._id)
    if(upadate_user.user_type == "pet sitter")
    {
        const images = req.files.map(file => file.path);
        const update_user = await user.findByIdAndUpdate(req.user._id,{
            gender:req.body.gender,
            first_name:req.body.first_name,
            last_name:req.body.last_name,
            lat:req.body.lat,
            long:req.body.long,
            age:req.body.age,   
            images:images,
            about:req.body.about
        })
        res.status(200).json({
            success:true,
            message: "Pet Sitter Information Added."
        })
    }

    else{
        res.status(200).json({
            success:false,
            message: "Your'e not a pett sitter."
        })
    }

})

module.exports = router