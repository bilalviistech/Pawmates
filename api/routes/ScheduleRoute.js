const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const schedule = require('../models/schedule.js')
const auth = require('../../middlewares/auth-middleware.js')


router.use('/add-date', auth)
router.post('/add-date', async(req,res,next)=>{
    
    try {
        const sitterId = req.user._id
        const date = req.body.date
        const services = req.body.services
        const dayOff = req.body.dayOff
        const service = services.split(",")

        const newSchedule = new schedule({
            _id:new mongoose.Types.ObjectId(),
            petSitterId: sitterId,
            date: date,
            dayOff: dayOff,
            services: service
        })
        await newSchedule.save()

        res.status(200).json({
            success: true,
            message: "Add Successfully."
        })
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        })
    }
})

router.use('/get-date', auth)
router.get('/get-date', async(req,res,next)=>{

    try {
        const sitterId = req.user._id
        const getDate = await schedule.find({petSitterId: sitterId});
        const dateObject = {};
        
        for (let i = 0; i < getDate.length; i++) {
            const date = getDate[i].date;
            if (!dateObject[date]) {
                dateObject[date] = [];
            }
            dateObject[date].push({
                services: getDate[i].services, 
                dayOff: getDate[i].dayOff
            });
        }
        
        res.status(200).json({
            success: true,
            data: dateObject
        });
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        });
    }
})

module.exports = router