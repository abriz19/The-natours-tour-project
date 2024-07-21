const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        maxLength:[40, 'A tour name must have a maximum length of 40'],
        minLength:[10, 'A tour name must have a minimum length of 10'],
        trim: true
       // validate: [validator.isAlpha, 'a tour name must be alphabetic letters']
    },
    duration:{
        type: Number,
        required: true,
    },
    maxGroupSize: {
        type: Number
    },
    slug: String,
    secretTour:{
        type: Boolean,
        default: false
    }, 
    difficulty: {
       type: String,
       enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'A tour should have a difficulty of either: easy, medium, or hard'
       }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        max: [5, 'ratings average has to be less or equal to be 5'],
        min: [1, 'ratings average has to be greater or equal to 1'],
        set: val => Math.round(val*10)/10 // we use this method to make some calculation on the value before it is stored
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val){
                return this.price>val //this validation only works when we are creating a new document. It does not work when we update a document
            },
            message: 'discount price should be ({VALUE}) less than the normal price'
        
        }
    },
    summary: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: true
        
    }, 
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDate: [Date], 
    startLocations: {
        //GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [ 
      {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number], //longitude and lattitude
        address: String,
        description: String,
        day: Number
      }
     ], 
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
    },
    { 
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//tourSchema.index({price: 1});
tourSchema.index({price: 1, ratingsAverage: 1});
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});

tourSchema.virtual('durationInWeek').get(function(){
    return this.duration/7;
})


tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async el => {
//          const user = await User.findById(el);
//          return user;
//     });
//      this.guides = await Promise.all(guidesPromises);
//     next();
// })

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: ('-passwordChangedAt -__v -_id')
    });
    next();
})



// tourSchema.pre('save', function(next){
//     this.slug = slugify(this.name, {lower: true});
//     next();
// })




tourSchema.pre(/^find/, function(next){
    this.find({secretTour: {$ne: true}});
    this.startDate = Date.now();
    next();
})


// tourSchema.pre('aggregate', function(next){
//     if(!this.pipeline()[0].$geoNear){
//      this.pipeline().unshift({$match: {secretTour: {$ne: true}}});
//     }
//     // console.log(this.pipeline()[0].$geoNear);
//     next();
// })


tourSchema.post(/^find/, function(docs, next){
    console.log(`Query execution time: ${Date.now()-this.startDate}`);
    next();
})


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;