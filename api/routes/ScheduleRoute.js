const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const schedule = require('../models/schedule.js')
const moment = require('moment');
const auth = require('../../middlewares/auth-middleware.js')


router.use('/add-date', auth)
router.post('/add-date', async(req,res,next)=>{
    
    try {
        const sitterId = req.user._id
        const date = req.body.date
        var services = req.body.services
        const dayOff = req.body.dayOff
        services = dayOff == true ? [] : services
        const scheduleExist = await schedule.findOne({petSitterId: sitterId, date: date})
        
        if(!scheduleExist){
            const newSchedule = new schedule({
                _id:new mongoose.Types.ObjectId(),
                petSitterId: sitterId,
                date: date,
                dayOff: dayOff,
                services: services
            })
            await newSchedule.save()
    
            res.status(200).json({
                success: true,
                message: "Add Successfully."
            })
        }

        else{
            scheduleExist.dayOff = (dayOff !== "" ? dayOff : scheduleExist.dayOff)
            scheduleExist.services = (services !== "" ? services : scheduleExist.services)
            scheduleExist.save()

            res.status(200).json({
                success: true,
                message: "Updated Successfully."
            })
        }
        
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
        const currentDateTime = new Date();
        // 'YYYY-MM-DD HH:mm:ss'
        const formattedDateTime = moment(currentDateTime).format('YYYY-MM-DD');

        console.log(formattedDateTime)
        // return

        const sitterId = req.user._id
        const getDate = await schedule.find({petSitterId: sitterId, date: {$gte: formattedDateTime}});
        const dateObject = {};
        
        for (let i = 0; i < getDate.length; i++) {
            const date = getDate[i].date;
            if (!dateObject[date]) {
                dateObject[date] = [];
            }
            dateObject[date].push({
                sitterId: getDate[i].petSitterId,
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