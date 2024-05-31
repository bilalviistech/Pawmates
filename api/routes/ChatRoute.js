const express = require('express')
const router = express.Router()
const mongoose =  require('mongoose')
const chat = require('../models/chatmessage')
const auth = require('../../middlewares/auth-middleware.js')

router.get('/getAllchat', auth, async (req,res,next)=>{
    const AuthName = req.user.name

    try {
        const AllChat = await chat.find({sender: AuthName})

        res.status(200).json({
            success: true,
            data: AllChat
        })
    } catch (error) {
        res.status(200).json({
            success: false,
            message: error.message
        })
    }
})



module.exports = router