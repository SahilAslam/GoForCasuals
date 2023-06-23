const mongoose = require('mongoose')

var productSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    price: {
        type: String,
        require: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        type:String,
        ref: 'category'
    },
    description: {
        type: String,
        require: true
    },
    photo: [{
        type: String,
        require: true
    }],
    stock: {
        type: Number,
        require: true
    },
    isBlocked: {
        type: Boolean,
        default: false,
    }
})

const Product = new mongoose.model('product', productSchema);

module.exports = Product