const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please tell us your frist name'],
            maxlength: [30, 'First name should be less than 30 character'],
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please provide a valid email'],
        },
        photo: {
            type: String,
            default: 'https://res.cloudinary.com/dcv1op3hs/image/upload/v1697170940/users/ogk5xpi6dc8agk9d4cq9.png',
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'manage'],
            default: 'user',
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 8,
            select: false,
        },
        passwordConfirm: {
            type: String,
            required: [true, 'Please confirm your password'],
            validate: {
                // This only works on CREATE and SAVE!!! EVEN IF use options new and runValidator in findAndUpdate
                validator: function (value) {
                    // This === curent document
                    return value === this.password;
                },
                message: 'Passwords are not the same!',
            },
        },
        refreshToken: { type: String, select: false },
        otp: String,
        otpExpires: Date,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);
userSchema.virtual('notifications', {
    ref: 'Notification',
    foreignField: 'receiver',
    localField: '_id',
    default: [],
});

userSchema.pre(/^find/, function (next) {
    this.select('-__v');
    next();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.passwordConfirm = undefined;
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.correctPassword = async (userPassword, passwordFromUser) => {
    return await bcrypt.compare(passwordFromUser, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
