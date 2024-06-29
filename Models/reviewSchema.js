const mongoose = require('mongoose');
 

// review , rating , createdAt , ref to tour , ref to user


const reviewSchema  = mongoose.Schema({
  review : {
    type:String,
    required:[true , "Review cannot be empty"],
    trim:true
  },
  rating:{
    type:Number,
    min:1,
    max:5
  },
  createdAt:{
    type:Date,
    default:Date.now()
  },
  tour:{
    type:mongoose.Schema.ObjectId,
    ref:'Tour',
    required:[true,'Review must belong to a tour']
  },
  user:{
    type:mongoose.Schema.ObjectId,
    ref:'User',
    required:[true,'Review must belong to a user']
  }
})


reviewSchema.pre(/^find/,function(next){
  // ! these all are same 
  // this.populate({
  //   path:'tour user',
  //   select:"name"
  // })   // or simply this.populate('user').populate('tour)

  // this.populate({
  //   path:'tour',
  //   select:'name '
  // }).populate({
  //   path:'user',
  //   select:'name photo'
  // })


  this.populate({
    path:'user',
    select:'name photos'
  })
  next()
})




const Review = mongoose.model("Review",reviewSchema);

module.exports = Review