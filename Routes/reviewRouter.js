const express =require('express');
const { allReviews, createNewReview, deleteReview, updateReview , setUpIds  } = require('../Controllers/reviewController');
const { protect, restrictTo } = require('../Controllers/authController');
const reviewRouter = express.Router({mergeParams:true}); // it means we can access tourId to all endpoint in this controller taking from parent route 


// /tourId/reviews/
reviewRouter.route("/").get(protect,allReviews).post(protect,restrictTo("user"),setUpIds,createNewReview)


// /tourId/reviews/reviewId
reviewRouter.route("/:id").delete(deleteReview).patch(protect,restrictTo('user'),updateReview)


module.exports = reviewRouter 
