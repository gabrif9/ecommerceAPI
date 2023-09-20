const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    _id: mongoose.Types.ObjectId,
    name: String,
    price: Number,
    category: String,
    description: String,
    image: String,
});

module.exports = mongoose.model('Product', productSchema)