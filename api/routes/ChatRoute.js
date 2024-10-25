const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const chat = require('../models/chatmessage')
const user = require('../models/user.js')
const auth = require('../../middlewares/auth-middleware.js')

router.get('/getAllchat', auth, async (req,res,next)=>{
    const AuthName = req.user.name

    try {
        const AllChat = await chat.find({sender: AuthName})
        const getAllChatData = []

        for(let i=0; i<AllChat.length; i++){
            const User = await user.findOne({name: AllChat.receiver})
            getAllChatData.push({
                _id: AllChat[i]._id,
                sender: AllChat[i].sender,
                receiver:AllChat[i].receiver,
                receiverImg: User.profileImage,
                message:AllChat[i].message,
                read: AllChat[i].read,
                timestamp: AllChat[i].timestamp,
            })
        }
        res.status(200).json({
            success: true,
            data: getAllChatData
        })
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        })
    }
})



module.exports = router