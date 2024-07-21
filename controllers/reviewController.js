const Review = require('../model/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


module.exports.gettingAllReviews = catchAsync(async (req, res, next) => {
    let filter = {};
    if(req.params.tourId) filter = {tour: req.params.tourId}
    const reviews = await Review.find(filter);

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    })
})

module.exports.getReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if(!review) {
        return next(new AppError('there is no review with this ID'));
    }

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    })
})

module.exports.createReview = catchAsync(async (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    const review = await Review.create(req.body);
    
        res.status(201).json({
        status: 'success',
        data: {
            review
        }
    })
});

module.exports.updateReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            review
        }

    })
});

module.exports.deleteReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: {
            review
        }
    })
})