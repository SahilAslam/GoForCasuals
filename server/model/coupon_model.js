const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        require: true
    },
    startingDate: {
        type: Date,
        require: true,
    },
    expiryDate: {
        type: Date,
        require: true
    },
    discount: {
        type: String,
        require: false,
    },
    status: {
        type: Boolean,
        dafault: false
    }
})

const coupon = new mongoose.model("Coupon", couponSchema)

module.exports = coupon
