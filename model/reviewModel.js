const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        minLength: 5,
        required: [true, 'review can not be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: Date,
    user: [
        {
        type: mongoose.Schema.ObjectId,
        ref: 'User', 
        required: [true, 'A review must belong to a user']
    }
    ],
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'A review must belong to a tour.']
    }
});


reviewSchema.index({tour: 1, user: 1}, {unique: true});

reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    // this keyword represents the Review model
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                reviewNum: {$sum: 1},
                reviewRating: {$avg: '$rating'}
            }
        }

    ]);
    console.log(stats);
    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].reviewRating,
            ratingsQuantity: stats[0].reviewNum
        });
    } else{
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0
        });
    }
 
};

reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne(); 
    console.log(this.r);
    next();
 });

 reviewSchema.post(/^findOneAnd/, async function() {
    // to get access of the review model from our pre mw we add a property called r in {{this}} object
    this.r.constructor.calcAverageRatings(this.r.tour);
 });

reviewSchema.post('save', function() {
    // Review.calcAverageRatings(this.tour); // We dont have access to the Review model so we cant use this
    this.constructor.calcAverageRatings(this.tour);
})


const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;