const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const user = require('../models/user.js')
const petsitterdetail = require('../models/petsitter_detail.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const OTP = require ("../models/otp.js")
const gallery = require ("../models/gallery.js")
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
router.post('/register',upload.single('profileImage'),async (req,res,next)=>{

    const check_email = req.body.email
    try 
    {
        const existingUser = await user.findOne({ email: check_email });
        const {user_type} = req.body;
        if (existingUser) 
        {
            res.status(200).json({
                success:false,
                message: "Email Already Exists."
            });
        }
        else
        {
            // console.log(req.file.path)
            // return
            const image = req.file.path;
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(req.body.password, salt);

            const newUser = new user({
                _id: new mongoose.Types.ObjectId(),
                name: req.body.name,
                email: req.body.email,
                password: hash,
                user_type: req.body.user_type,
                profileImage: image
            });
            await newUser.save();

            res.status(200).json({
                success: true,
                message: "User Created"
            });
        }
    } catch (err) {
        console.error(err);
        res.status(200).json({
            success:false,
            message: err.message
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
                success: false,
                message: "User Not Found"
            })
        }
        bcrypt.compare(req.body.password,user[0].password,(err,result)=>{
            if(result)
            {
                var fullUrl = req.protocol + '://' + req.get('host') + '/uploads/';
                const token = jwt.sign({
                    id:user[0]._id,
                    name:user[0].name,
                    email:user[0].email,
                    user_type:user[0].user_type
                },
                
                "bafhsd7asu45TX0dbsa8dy98wsdj98",{
                    // expiresIn:"24h"
                    expiresIn: "365d"
                })
                res.status(200).json({
                    success:true,
                    path: fullUrl,
                    data: {
                        id:user[0].id,
                        name:user[0].name,
                        email:user[0].email,
                        user_type:user[0].user_type,
                        profileImage:user[0].profileImage,
                        emailVerify:user[0].emailVerify,
                        pet_add_status:user[0].pet_add_status,
                        petSitter_update_status:user[0].petSitter_update_status,
                        token:token
                    },
                });
            }
            else{
                return res.status(200).json({
                    success: false,
                    message:"Password Doesn't Match"
                })
            }
        })
    })
    .catch(err=>{
        res.status(200).json({
            success:false,
            message: err.message
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
            success:false,
            message: "Password Field Must Be Added."
        })
    }
    else{
        await user.findByIdAndUpdate(req.user._id,
            {
                $set:{password:hash}
            })
        res.status(200).json({
            success:true,
            message: "Password Has Been Changed."
        })
    }
})

// User Verification Code Sent To Email
router.post('/email-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (email) 
        {
            const user_email = await user.findOne({ email: email })
            if (user_email) {
                const otp = Math.floor(10000 + Math.random() * 90000);
                // Store the OTP in the database
                const otpData = new OTP({
                    _id: new mongoose.Types.ObjectId(),
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
                        res.status(200).json({
                            success:false,
                            message: 'Failed To Send OTP.'
                        });
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.status(200).json({
                            success:true,
                            message: 'OTP Sent Successfully.',
                            id : user_email?._id,
                            "OTP Code" : otp
                        });
                    }
                });

            } else {
                res.status(200).json({
                    success:false,
                    message: "Email Does Not Exist."
                })

            }
        } else {
            res.status(200).json({
                success:false,
                message: "Please Enter Your Correct Email."
            })

        }
    } catch (error) {
        res.status(200).json({
            success:false,
            message: error.message
        })
    }
})

// Otp Verify
router.post('/email-verify-otp',async (req,res,next)=>{
    try {
        const {otp, id} = req.body;
        const otpData = await OTP.findOne({ userId: id, otpCode: otp });
        if(otpData){
            await user.findByIdAndUpdate(id , { $set: {emailVerify: 1}})

            res.status(200).json({
                success: true,
                message: "Email Verified Successfully."
            })
        }
        
        else{
            res.status(200).json({
                success: false,
                message: "Invalid Otp."
            })

        }
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        })
    }
    
})

router.post('/change-password',async (req,res,next)=>{
    const {password, id} = req.body
    const saltt = await bcrypt.genSalt(10);
    
    const hashed = await bcrypt.hash(password, saltt);
    if(!hashed){
        res.status(200).json({
            success:false,
            message: "Password Field Must Be Added."
        })
    }
    else{
        const check = await user.findByIdAndUpdate(id,
            {
                $set:{password:hashed}
            })
        res.status(200).json({
            success:true,
            message: "Password Has Been Changed."
        })
    }
})

router.use('/update-info',auth)
router.post('/update-info',upload.array('images', 5), async(req,res,next)=>{
    const upadate_user = await user.findById(req.user._id)
    const existing_upadate_user = await petsitterdetail.findOne({petSitterId:req.user._id})
    if(upadate_user.user_type == "pet sitter")
    {
        if(existing_upadate_user)
        {
            res.status(200).json({
                success:false,
                message: "Pet Sitter Information Already Added."
            })
        }  

        else
        {
            const images = req.files.map(file => file.path);
            const newPetSitterDetail = new petsitterdetail({
                _id:new mongoose.Types.ObjectId(),
                petSitterId:upadate_user._id,
                gender:req.body.gender,
                petPurposeType:JSON.parse(req.body.petPurposeType),
                categoryName:JSON.parse(req.body.categoryName),
                age:req.body.age,   
                images:images,
                about:req.body.about,
                name:upadate_user.name,
                pet_size:JSON.parse(req.body.pet_size),
                location:{
                    type:"Point",
                    coordinates:[
                        parseFloat(req.body.longitude),
                        parseFloat(req.body.latitude)
                    ]
                },
            })
            await newPetSitterDetail.save();

            if(newPetSitterDetail)
            {
                // console.log(typeof)
                await user.findByIdAndUpdate(upadate_user._id,{
                    $set:{petSitter_update_status:1}
                })
            }

            res.status(200).json({
                success:true,
                message: "Pet Sitter Information Added."
            })
        }
    }

    else{
        res.status(200).json({
            success:false,
            message: "Your'e not a pet sitter."
        })
    }

})

router.use('/get-profile-info',auth)
router.get('/get-profile-info', async(req,res,next)=>{
    try {
        const UserExists = await user.findById(req.user._id)
        if(UserExists)
        {
            const UserExistDetail = await petsitterdetail.findOne({petSitterId: UserExists._id})
            const galleryInfo = await gallery.findOne({petSitterId: UserExists._id})
            var galleryUrl = req.protocol + '://' + req.get('host') + '/gallery/';
            var uploadUrl = req.protocol + '://' + req.get('host') + '/uploads/';
            res.status(200).json({
                success:true,
                galleryUrl:galleryUrl,
                uploadUrl:uploadUrl,
                data:{
                    userId:UserExists._id,
                    name:(UserExistDetail ? UserExistDetail.name : null),
                    profileImage:(UserExists ? UserExists.profileImage : null),
                    petPurposeType:(UserExistDetail ? UserExistDetail.petPurposeType : null),
                    categoryName:(UserExistDetail ? UserExistDetail.categoryName : null),
                    pet_size:(UserExistDetail ? UserExistDetail.pet_size : null),
                    age:(UserExistDetail ? UserExistDetail.age : null),
                    about:(UserExistDetail ? UserExistDetail.about : null),
                    gender:(UserExistDetail ? UserExistDetail.gender : null),
                    images:(UserExistDetail ? UserExistDetail.images : null),
                    imagesGallery:(galleryInfo ? galleryInfo.imagesGallery : null),
                }
                
            })
        }
        else
        {
            res.status(200).json({
                success:false,
                message: "Pet Sitter Doesn't Exist."
            })
        }
    } catch (error) {
        res.status(200).json({
            success:false,
            message: error.message
        })
    }
})

// Profile Update
router.use('/profile-update',auth)
router.post('/profile-update',upload.single('updateProfileImage'), async(req,res,next)=>{
    try {
        const Sitter_id = req.user._id;
        const updateLatitude = req.body.latitude
        const updateLongitude = req.body.longitude
        const updatePetPurposeType = JSON.parse(req.body.petPurposeType)
        const updateCategoryName = JSON.parse(req.body.categoryName)
        const updatePet_size = JSON.parse(req.body.pet_size)
        const updateAge = req.body.age
        const updateAbout = req.body.about
        const updateName = req.body.name
        const updateGender = req.body.gender
        const updateImage = req.file;
        // console.log(updateImage,updateImage.path)
        // return

        if(Sitter_id) {
            const filter = { petSitterId: Sitter_id };
            const update = {};
        
            if ( updateAbout != "" && updateAbout != undefined) {
                update.about = updateAbout
            }
        
            if (updateName != "" && updateName != undefined) {
            update.name = updateName;
            }
        
            if (updateAge != "" && updateAge != undefined) {
            update.age = updateAge;
            }
            if (updateGender != "" && updateGender != undefined) {
            update.gender = updateGender;
            }
            if (updatePetPurposeType.length > 0) {
            update.petPurposeType = updatePetPurposeType;
            }
            if (updateCategoryName.length > 0) {
            update.categoryName = updateCategoryName;
            }
            if (updatePet_size.length > 0) {
            update.pet_size = updatePet_size;
            }
            if (updateLongitude != "" && updateLatitude !="") {
                update.location = {
                    type:"Point",
                    coordinates:[
                        JSON.parse(updateLongitude),
                        JSON.parse(updateLatitude)
                    ]
                }
            }
            
            const recordFindUpdate = await petsitterdetail.findOneAndUpdate(filter, update);

            if(recordFindUpdate){
                const userFilter = { _id: Sitter_id };
                const userUpdate = {};

                if (updateImage) {
                    userUpdate.profileImage = updateImage.path;
                }
                if (update.name) {
                    userUpdate.name = update.name;
                }

                const recordFindUpdate = await user.findOneAndUpdate(userFilter, userUpdate);
                // if(update.name){
                //     await user.findByIdAndUpdate(Sitter_id, {$set :{name:update.name}});
                // }
                res.status(200).json({
                    success: true,
                    message:"Profile Succesfully Updated.",
                    data: {
                        about:update.about,
                        name:update.name,
                        age:update.age,
                        gender:update.gender,
                        petPurposeType:update.petPurposeType,
                        categoryName:update.categoryName,
                        pet_size:update.pet_size,
                        location:update.location,   
                        profileImage:updateImage ? updateImage.path : recordFindUpdate.profileImage
                    }
                })
            }
            else{
                res.status(200).json({
                    success: false,
                    message: "Something Went Wrong."
                })
            }
        }
        else{
            res.status(200).json({
                success: false,
                message: "Pet Sitter Doesn't Exist."
            })
        }
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        })
    }
    
})

module.exports = router