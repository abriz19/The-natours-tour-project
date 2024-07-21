const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const router = express.Router({ mergeParams: true });

// POST tours/:tourId/reviews  GET
// POST /reviews  GET

router.use(authController.protect);

router.route('/')
.post(authController.restrict('user'), reviewController.createReview)
.get(reviewController.gettingAllReviews);

router.route('/:id')
.get(reviewController.getReview)
.patch(authController.restrict('admin', 'user'), reviewController.updateReview)
.delete(authController.restrict('admin', 'lead-guide'), reviewController.deleteReview)
module.exports = router;