const fs = require('fs');
const Tour = require('../model/tourModel');
const APIfeatures = require('./../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.topFiveCheapTours = (req, res, next) => {
    req.query.limit = 5;
    req.query.sort = ('price,-ratingAverages');
    req.query.fields=('name,duration,difficulty');
    next();
}

exports.getAllTours = catchAsync(async (req, res, next) => {
    const features = new APIfeatures(Tour.find(), req.query)
            .filter()
            .sort()
            .fields()
            .pagination(); 
    //const tours = await features.query.explain();
    const tours = await features.query;


    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours: tours
        }
    });
});



exports.getSingleTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id).populate('reviews');
    //Tour.findOne({id: req.params.id})
    console.log(tour);
    if(!tour){
        return next(new AppError('there is no tour with this ID', 404));
     }
    res.status(200).json({
        status: 'success',
        data: {
            tour: tour
        }
    });
   
});


exports.updateTour = catchAsync(async (req, res, next) => {
    console.log(req.body);
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if(!tour){
            return next(new AppError('there is no tour with this ID', 404));
         }
        res.status(200).json({
            status: 'success',
            data: {
                tour: tour
            }
        });
        
});


exports.createTour = catchAsync(async (req, res, next) => {
        const tour = await Tour.create(req.body);

        res
        .status(201)
        .json({
            status: 'success',
            data: {tour: tour}
        });

});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.getTourStats = catchAsync(async (req, res, next) => {
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage: {$gte: 2}}
            },
            {
                $group:   {
                    _id: {$toUpper: '$difficulty'},
                    num: {$sum: 1},
                    avgPrice: {$avg: '$price'},
                    maxPrice: {$max: '$price'},
                    minPrice: {$min: '$price'},
                    averageRatings: {$avg: '$ratingsAverage'}
                }
            },
             {
                $sort: { avgPrice: 1 }
             },
             {
                $match: {_id: {$ne: 'EASY'}}
             }  
        ]);
        res
        .status(200)
        .json({
            status: 'success',
            data: {
                stats
            }
        });

});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
        const year = req.params.year * 1;
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDate'
            },
            {
                $match: {
                    startDate: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    } },
                }, 
                {
                $group: {
                    _id: {$month: '$startDate'},
                    numOfTours: {$sum: 1},
                    tours: {$push: '$name'}
                }
                 },
                  {
                $addFields:{month: '$_id'},
                },
                {
                    $project: {
                        _id: 0
                    }
                },
                {
                    $sort: {numOfTours: 1}
                }
        ]);
        res.status(200).json({
            status: 'success',
            result: plan.length,
            data: {
                plan
            }
        });
 
});

exports.toursWithInYourLocation = catchAsync ( async (req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi'? distance/3963.2 : distance/6378.1;
    console.log(radius, lng, lat);
    if(!lat, !lng){
        return next(new AppError('please provide your location in the format lat,lng', 400));
    }

        const tours = await Tour.find({startLocations: {$geoWithin: {$centerSphere:[[lng, lat], radius]}}});

        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours
            }
        })
})


exports.getAllDistances = catchAsync(async (req, res, next) => {
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');
    const multiplier = unit === 'mi'? 0.00621371 : 0.001;

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near:{
                    type: 'Point',
                    coordinates: [lng*1, lat*1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            },
        },
        {
            $project:{
                distance: 1,
                name: 1
            }        
        }     
    ])
 })





