const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        type: String,
        ref: 'category'
    },
    description: {
        type: String,
        required: true
    },
    photo: [{
        type: String,
        required: true
    }],
    stock: {
        type: Number,
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false,
    }
});

// Create a text index on the 'name' field
productSchema.index({ name: 'text' });

const Product = mongoose.model('product', productSchema);

module.exports = Product;
