const mongoose = require('mongoose')

const bannerSchema= new mongoose.Schema({
    name:{
        type:String,
        require:true
    }, 
    photo:[{
        type:String,
        require:true,
       
       
    }],


    date:{
        type:Date,
        require:true
    },
    status:{
        type:Boolean,
       default:false
    }
    
})
const Banner = new mongoose.model("banner",bannerSchema)

module.exports = Banner