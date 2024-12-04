const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    posttext :{
        type: String,
        required: [true, 'Post text is required.'],
        maxlength: [28, 'Post text cannot exceed 28 characters.']
    },
    description :{
        type: String,
        required: false,
        maxlength: [150, 'Description cannot exceed 150 characters.']
        },
    image:{
     type : String,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    createdate:{
        type: Date,
        default: Date.now,
    },
    likes:{
        type: Array,
        default: [],
    }
})

module.exports = mongoose.model('Post', postSchema);
