const mongoose = require('mongoose');
const User = require('./userSchema')

const tourSchema = new mongoose.Schema({
  name:{
    type:String,
    required:[true,"A tour must have a name"],
    unique:true, // i.e , no tour document have same name 
    trim:true // ! if type is "String", then trim will remove leading and trailing whitespace from the string before saving it to the database.
  } ,  
  // ! The required property is set to [true, "A tour must have a name"]. This means that when creating a new tour document,
  // ! the name field must be provided. If it's not provided, Mongoose will throw a validation error with the message "A tour must have a name".
  duration:{
    type:Number,
    required:[true,"A tour must have a duration"]
  },
  maxGroupSize:{
    type:Number,
    required:[true,"A tour must have a max group size"]
  },
  difficulty:{
    type:String,
    required:[true,"A tour must have a difficulty level"]
  },
  ratingsAverage:{
    type:Number,
    default:4 // * i.e, if the rating is not provided , it will defautl give 4
  },
  ratingsQuantity:{
    type:Number,
    default:0 
  },
  price:{
    type:Number,
    required:[true,"A tour must have a price"],
  },
  priceDiscoumt : {
    type:Number
  },
  summary:{
    type:String,
    trim:true,
    required:[true,"A tour must have summary"]
  },
  description:{
    type:String,
    trim : true,
  },
  imageCover:{
    type:String,
    required:[true, "A tour must have a image"]
  },
  images:[String],
  createdAt:{
    type:Date,
    default: Date.now(),
    select:false,   // ! this property is not select when we query a query object using a select() method, this property is significant when we are always hiding password when we do a query with select()
 },
  // different dates of paticular tour which is start once end , or start soon 
  startDates:[Date],
  startLocation : { // This curly braces shows this is embedded objects
    // GeoSpatial data must have "type" and "cordinate" property
    type:{
      type : String,
      default:"Point",
      enum : ['Point'],
    },
    coordinate:[Number], // cordinate of the point i.e first longitude and then latitude
    address : String,
    description : String
  },
  location : [
    {
      type:{
        type:String,
        default:'Point',
        enum:['Point']
      },
      coordinate:[Number],
      address:String,
      description:String,
      day:Number
    }
  ],
  //! // ! Here we will give id of guides inside array and before saving any tour document , what we will simply do we will find the user by id and insert into  them 
  // guides:Array, // if you need an array that can hold any type of elements (similar to using type: Array), 


  // ! Here we are doing child refrencing with guide that is only giving the id 
  guides : [
    {
      type:mongoose.Schema.ObjectId,
      ref:"User"
    }
  ],
  
}, 
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})


// ! Note :- we are embedding the User document data who is "guide" , into the tour document before saving the new tour doument
// tourSchema.pre('save', async function(next){
//   const guidePromise =  this.guides.map(async id=> await  User.findById(id));
//   // console.log(guidePromise);
//   const guides = await Promise.all(guidePromise);
//   // console.log(guides);
//   this.guides = guidePromise
//   next()
// })


//!  "populate" typically refers to the process of automatically replacing the specified paths in the document with document(s) from other collection(s). To simplify queries when you need related data from different collections.
//! the "this" keyword in pre middleware refers to the document or query being processed. 
//! Query middleware is used to define middleware functions that run before/after query operations like find, findOne, update, etc.
tourSchema.pre(/^find/,function(next){
  // here this keyword represent the query object and we can chain over this query object
  this.populate({
    path:'guides',
    select:"-__v -_id -passwordChangedAt"
  })
  next();
})


// VIRTUAL POPULATING THE REVIEWS :- 
// property name "reviews" inserted virtually  and then we have to use .populate('reviews)
tourSchema.virtual('reviews',{
  ref:'Review',  // This specifies the model to use for the relationship.
  localField:'_id',
  foreignField:'tour'
})

const Tour = mongoose.model('Tour',tourSchema);

module.exports = Tour;
