const express = require('express')
const app = express()
const db = require('./connectDB.js')
const bodyParser = require('body-parser')
const UserRoute = require('./api/routes/UserRoute.js')
const PetRoute = require('./api/routes/PetRoute.js')
const io = require('./server.js')
db()    

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json()) 

//Routes
app.use('/user',UserRoute)
app.use('/pet',PetRoute)

// Bad Request
app.use((req,res,next)=>{
    res.status(400).json({
        message : 'Bad request.'
    })
})

module.exports = app