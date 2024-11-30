const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
    {
        email: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true,  
            trim: true, 
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
        },
        password: { 
            type: String, 
            required: true 
        },
        username: { 
            type: String, 
            unique: true, 
            trim: true,   
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot be more than 30 characters'],
            match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'], // Regex for username validation
        },
        profilepicture: { 
            type: String, 
            required: false, // Profile picture will be optional
            default: 'default-profile-pic.jpg', // Optional default profile picture
        },
        posts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref:'Post'
        }],
        savedPosts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref:'SavedPost'
        }],          
    },
    {
        timestamps: true, 
    }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
