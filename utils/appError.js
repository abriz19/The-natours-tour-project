class AppError extends Error{
    constructor(message, statusCode){
        super(message); //return us the error message
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.construtor);
    }
}

module.exports = AppError; 