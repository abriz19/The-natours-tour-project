const { trusted } = require('mongoose');
const User = require('../model/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


const filterObj =  (obj, ...updatedFileds ) => {
    const newObj = {};
    Object.keys(obj).forEach(element => {
    if(updatedFileds.includes(element)){
        newObj[element]= obj[element];
    }
})
  return newObj;
}




exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: users
    })
});


exports.getSingleUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'Error with the server'
    })
}


exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'Error with the server'
    })
}


exports.updatedUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'Error with the server'
    })
}


exports.getMe = async(req, res, next) => {

    const user = await User.findById(req.user.id);

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    })
}
exports.updateMe = catchAsync(async (req, res, next) => {
    // 1, check if a user posted a password 
    if(req.body.password || req.body.passwordConfirmation){
        return next(new AppError('You are not allowed to change your password in this route', 400));
    }
    // 2, update the user
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });
    console.log(updatedUser);
    
    res.status(200).json({
        status: 'success',
        message: 'Updated successfully',
        data: updatedUser
    })
})


exports.deleteMe = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {active: false}, {
        new: true,
        runValidators: true
    });

    res.status(204).json({
        status: 'success'
    })
})


exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'Error with the server'
    })
}

