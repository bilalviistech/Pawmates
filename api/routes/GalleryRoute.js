const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const user = require('../models/user.js')
const gallery = require('../models/gallery.js')
const auth = require('../../middlewares/auth-middleware.js')
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'gallery/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
});
  
// Create multer upload instance
const upload = multer({ storage: storage });

router.use('/post',auth)
router.post('/post',upload.array('imagesGallery', 5), async(req,res,next)=>{
    try {
        const sitterExist = await user.findById(req.user._id)
        const imagesGallery = req.files.map(file => file.path);
        if(sitterExist)
        {
            const galleryExist = await gallery.findOne({petSitterId: req.user._id})
            if(!galleryExist)
            {
                const newGallery = new gallery({
                    _id: new mongoose.Types.ObjectId(),
                    petSitterId: req.user._id,
                    imagesGallery: imagesGallery
                });
                await newGallery.save();
    
                res.status(200).json({
                    success: true,
                    message: 'Image Add In Your Gallery Section.'
                })
            }
            else
            {
                await gallery.findByIdAndUpdate(galleryExist._id, {
                    $push: {
                        imagesGallery: {$each: imagesGallery}
                    }
                });
                res.status(200).json({
                    success: true,
                    message: 'Image Add In Your Gallery Section.'
                });
            }
            
        }
        else
        {
            res.status(200).json({
                success: false,
                message: "Pet Sitter Doesn't Exists."
            })
        }
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        })
    }
})

router.use('/get',auth)
router.get('/get',async(req,res,next)=>{
    try {
        var fullUrl = req.protocol + '://' + req.get('host') + '/gallery/';
        const getGallery = await gallery.findOne({petSitterId: req.user._id})
        res.status(200).json({
            success: true,
            path: fullUrl,
            message: getGallery
        })
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        })
    }
})



module.exports = router