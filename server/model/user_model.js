const mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    username: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    phone: {
        type: Number,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    isBlocked: {
        default: false,
        type: Boolean
    },
    address: [{
        name: String,
        address: String,
        phone: Number,
        pincode: Number,
        city: String,
        state: String
    }],
    coupon: [
        String
    ]

})

const UserDb = new mongoose.model('user_details', userSchema);

module.exports = UserDb;