const mongoose = require('mongoose')

const connectDB = ()=>{
    // const connect =  mongoose.connect("mongodb://127.0.0.1:27017")
    const connect =  mongoose.connect("mongodb+srv://pawmatesapps:mRQ1lJS0KojQv9mx@cluster0.rx5dvki.mongodb.net/?retryWrites=true&w=majority")
    const db = mongoose.connection

    db.on("error", err=>console.log(err))
    db.once("open",()=>console.log("DB Connected"))
}

module.exports = connectDB