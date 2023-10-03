const mongoose = require('mongoose')

const connectDB = ()=>{
    const connect =  mongoose.connect("mongodb://127.0.0.1:27017")
    const db = mongoose.connection

    db.on("error", err=>console.log(err))
    db.once("open",()=>console.log("DB Connected"))
}

module.exports = connectDB