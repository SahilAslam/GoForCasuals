const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    orderId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
    }],
    balance: {
        type: Number,
        required: true
    },
    transactions: [{
        type: String,
        required: true
    }],
    date: {
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('wallet', walletSchema)