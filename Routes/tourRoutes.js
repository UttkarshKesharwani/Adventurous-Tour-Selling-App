
const express = require('express');
const {getAllTours, createTour, getTours, updateTour, deleteTour, aliasTopTours, getTourStats, getMonthlyPlan, updateTourImages, resizingTourImages } = require('../Controllers/tourController');
const { protect ,restrictTo} = require('../Controllers/authController');
const { createNewReview, allReviews } = require('../Controllers/reviewController');
const reviewRouter = require('./reviewRouter');
const tourRouter = express.Router();

// * here actually "val" will hold the value of "id" , this middleware function will work when it check whether the incoming request to endpoint whether contain the paramater as "id" or not
//  *  It allows you to define middleware that will be executed whenever certain parameters are present in the URL path.
// ! tourRouter.param('id', checkId);

tourRouter.route("/get-top-tours").get(aliasTopTours,getAllTours)
tourRouter.get("/get-stats",getTourStats)
tourRouter.get("/get-monthlyPlan/:year",getMonthlyPlan)

tourRouter
  .route('/')
  .get(getAllTours)
  .post(protect,restrictTo('admin','lead-guide'),createTour);

tourRouter
  .route('/:id')
  .get(getTours)
  .patch(protect,restrictTo('admin','lead-guide'),updateTourImages,resizingTourImages,updateTour)
  .delete(protect,restrictTo('admin','lead-guide'),deleteTour); 


// tourRouter.route("/:tourId/review").post(protect,restrictTo("user"),createNewReview).get(allReviews)
//! We are mounting this tourRouter on reviewRouter because it is clumsy to code here because it is tourRouter and we should do all functionality of review in review controller 
//! But we need tour id there to create review ,thus we do mergeParams in reviewRouter to acces tourId there from the parent route 
tourRouter.use("/:tourId/reviews",reviewRouter)





module.exports = tourRouter;
 