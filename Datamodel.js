const mongoose = require('mongoose')

const ProductDataSchema = mongoose.Schema(
    {
        productName: String,
        categoryName: String,
        description: String,
        image: String
    },

)

mongoose.model('ProductData', ProductDataSchema)
