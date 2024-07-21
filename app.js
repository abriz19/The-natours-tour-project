const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');

const reviewRouter = require('./routes/reviewRoute');
const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoute');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const app = express();

app.set('view engine', 'pug');

// GLOBAL MIDDLEWARES
console.log(process.env.NODE_ENV);

// set security http headers
app.use(helmet());

// 1, logging middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}
const limiter = rateLimit({
    max: 100,
    windowMS: 60 * 60 * 1000,
    message: 'too many requests from this IP. please try again'
})

// 2, request limiter from the same IP
app.use('/api', limiter);

// 3, body parser middleware into req.body 
app.use(express.json({limit: "10kb"}));

// data sanitization against NoSQL injection
app.use(mongoSanitize());

// data sanitization against xss attacks
app.use(xss());

// 4, serving static files
app.use(express.static(`${__dirname}/public`));
 
// 5, test middlewares
app.use((req, res, next) => {
   console.log('hey this is a middleware', process.env.JWT_EXPIRES_IN);
    next();
});
app.use((req, res, next) => {
    const requestTime = new Date().toISOString();
    next();
})

//ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);


app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message:`can't find ${req.originalUrl} on this server`
    // });
    // const err = new Error(`can't find ${req.originalUrl} on this server`);
    // err.statusCode = 404;
    // err.status = 'fail' 
    next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;