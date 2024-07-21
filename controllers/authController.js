const { promisify }  = require('util');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const User = require('../model/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');

const generateToken = id => {
    const expiresAt = process.env.JWT_EXPIRES_IN;
    return  jwt.sign({id: id}, process.env.JWT_SECRET, {
            expiresIn: `${expiresAt}`
            });
}

const createSendToken = (user, res, statusCode) => {
    const token = generateToken(user._id);

    const cookieOptions = {
        expires: new Date (Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
 if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    res.status(statusCode).json({
        status: 'success',
        token
    });

}

exports.signupUser = catchAsync( async(req, res, next) =>{
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        passwordConfirmation: req.body.passwordConfirmation
    });
    createSendToken(newUser, res, 201);
  
});

exports.loginUser = catchAsync( async(req, res, next) => {
    const {email, password} = req.body;

    //1, check the email and password fields are filled
    if(!email || !password){
        return next(new AppError('please provide email and password', 400));
    }

    const user = await User.findOne({email: email}).select('+password');
    if(!user){
        return next(new AppError('Incorrect email or password', 401));
    }
    else{
       // 2, compare the credintial password is the same with the encrypted one 
        const correct = await user.comparePassword(password, user.password)
        if(!correct){
            return next(new AppError('Incorrect email or password', 401));
        }
        else{
            createSendToken(user, res, 200);
        }
    }
});

exports.protect = catchAsync( async(req, res, next) => {
    let token;

    // 1, getting token and check of it's there
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
        console.log(token);
        console.log(process.env.JWT_EXPIRES_IN);
    }
    if(!token){
        return next(new AppError('please login first!', 401));
    }

    // 2, token verification
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    console.log(decode);

    // 3, check if the user still exists
    const freshUser = await User.findById(decode.id);
    if (!freshUser){
        return next(new AppError('the user with this token does no longer exist!', 401));
    }
    // 4, check if user changed password after the token is issued
    console.log(decode.iat);
    if(freshUser.changedPasswordAfter(decode.iat)){
        next(new AppError('the user has changed password recently! please login again.', 401))
    }
    req.user = freshUser;


    next();
});


exports.restrict = (...roles) => {
    // roles returns an array of passed arguments
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError('you are not allowed to perform this action', 403));
        }
        next();
    }
}

module.exports.forgotPassword = catchAsync( async(req, res, next) => {
    // 1, get user based on posted email
    
    const user = await User.findOne({email: req.body.email});

    if(!user){
        return next(new AppError('There is no user with this email', 404));
    }
    // 2, generate the random reset token 
    const resetToken = user.forgotPasswordResetToken();
    user.save({validateBeforeSave: false});

    // 3, send it to user's email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? submit a PATCH request with your new password and passwordconfirm to ${resetUrl}.\n If you didn't forget your password please ignore this email`;
    try{ 
    await sendEmail({
        email: user.email,
        subject: 'Your password reset token, valid for only 10 mins',
        message
    })
    res.status(200).json({
        status:  'success',
        message: 'your reset token is sent'
    })
    }catch(err){
        return next(new AppError('There is a problem while sending the email! Please try again', 500));
        //return next(err);
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1, check if the user exists
    const hashedPassword = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: hashedPassword, resetTokenExpiresAt: {$gt: Date.now()}});
    if(!user) {
        return next(new AppError('Invalid token or the token has expired', 400));
    }
    // 2, update the user password 
    user.password = req.body.password;
    user.passwordConfirmation = req.body.passwordConfirmation;
    user.resetTokenExpiresAt = undefined;
    user.passwordResetToken = undefined;
    await user.save();

    // 3, update the password changedAt property


    // 4, logged in the user
    createSendToken(user, res, 200);

   

});

exports.updatePassword = catchAsync(async(req, res, next) => {
    // 1, get the posted user from the collection
    const user = await User.findById(req.user._id).select('+password');
    // 2, check if the user password is the same with the one found in DB
    const comparePassword = user.comparePassword(req.body.oldPassword, user.password);
    if(!comparePassword){
        return next(new AppError('your old password is not correct! please enter again', 400));
    }
    // 3, if so, change the password
    user.password = req.body.newPassword;
    user.passwordConfirmation = req.body.confirmPassword;
    await user.save();

    // 4, log in the user
    createSendToken(user, res, 200);

})