const Review = require('../Models/reviewSchema');
const factory = require('./handleFactory');



// ! Doing nested route 


const allReviews = async (req,res)=>{
  let filter = {}
  if(req.params.tourId) filter = {tour:req.params.tourId}
  const reviews = await Review.find(filter)
  return res.status(200).json({
    status:"success",
    data:reviews
  })
}



// const createNewReview = async (req,res)=>{
//   try {
//     // Basically setting body , if the user gives directly from body then no problem otherwise setting body 
//     if(!req.body.tour) req.body.tour = req.params.tourId;
//     if(!req.body.user) req.body.user = req.user.id   // req.user coming from protect middleware 
//     const review = await Review.create(req.body);
//     return res.status(201).json({
//       status:"success",
//       data:review
//     })
//   } catch (error) {
//     return res.status(404).json({
//       status:"fail",
//       message:error
//     })
//   }
// }
const setUpIds = (req,res,next)=>{
  if(!req.body.tour) req.body.tour = req.params.tourId
  if(!req.body.user) req.body.user = req.user.id
  next()
}
const createNewReview = factory.createOne(Review);

const deleteReview = factory.deleteOne(Review);

const updateReview = factory.updateOne(Review)


module.exports = {
  allReviews,createNewReview,deleteReview,updateReview,setUpIds
}
