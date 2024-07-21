const AppError = require("../utils/appError");

const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
};

const handleDuplicateFields = (err) => {
    const message = `duplicate field value: ${Object.values(err.keyValue)}, please use another value`;
    return new AppError(message, 400);
}

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join(', ')}`
    return new AppError(message, 400);
}

const handleTokenExpiredError = (err) => {
    return new AppError('Your token has expired. please login again!', 401);
}

const handleJsonWebTokenError = (err) => {
    return new AppError('Invalid token! please login again.', 401);
}




const sendErrorProd = (err, res) => {

    //operational error trusted error send it back to the client
    if(err.isOperational){ 
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
    }

    //programming or other unknown error: don't leak error details
    else{
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Sorry something went wrong'
    })
  }
};



const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        error: err,
        status: err.status,
        message: err.message,
        stack: err.stack
    });
}

    




module.exports = (err, req, res, next) => {

err.statusCode = err.statusCode || 500;
err.status = err.status || 'error';

if(process.env.NODE_ENV === 'development'){
    sendErrorDev(err, res);
}
else if(process.env.NODE_ENV === 'production'){
    if (err.name === "CastError"){
        err = handleCastError(err);
    }
    if(err.code === 11000){
        //console.log(err);
        err = handleDuplicateFields(err)
    }
    if(err.name === "ValidationError"){
        err = handleValidationError(err);
    }
    if(err.name === "TokenExpiredError"){
        err = handleTokenExpiredError(err);
    }
    if(err.name === "JsonWebTokenError"){
        err = handleJsonWebTokenError(err);
    }
    sendErrorProd(err, res);
}
}; 