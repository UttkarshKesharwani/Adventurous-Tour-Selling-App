const fs = require('fs');
const Tour = require('../Models/tourSchema');
const { throws } = require('assert');
const factory = require('./handleFactory');
const upload = require('../Utils/multerConfig');
const sharp = require('sharp');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

//! const jsonString = '{"name": "John", "age": 30, "city": "New York"}';
//! const jsonObject = JSON.parse(jsonString);
//! console.log(jsonObject); // Output: { name: 'John', age: 30, city: 'New York' }

// ! const checkId = (req, res, next, val) => {
//   // ! insted "req.params.id" , we can also write "val"
//   if (req.params.id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid Id',
//     });
//   }
//   next();
// }











const updateTourImages = upload.fields([
  {name:'images',maxCount:3},
  {name:'imageCover',maxCount:1}
]) 

const resizingTourImages = async (req,res,next)=>{
  console.log(req.files)

  if(!req.files.images || !req.files.imageCover) return next();

  //1)  Processing imageCover

  req.body.imageCover = `tour-${req.params.id}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333)
    .toFormat('jpeg')
    .toFile(`PhotoUploads/ToursImageCover/${req.body.imageCover}`);

  
 
  //  2) Processing Tour images
  req.body.images = [];

  Promise.all(
    req.files.images.map( async (file,ind)=>{

      const filename =  `tour-${req.params.id}-${ind+1}.jpeg`;
       sharp(file.buffer)
      .resize(2000,1333)
      .toFormat('jpeg')
      .toFile(`PhotoUploads/ToursImage/${filename}`);
  
      req.body.images.push(filename)
    })
  )

  // console.log(req.body.images)

  next()
} 
 

const aliasTopTours = (req,res,next)=>{
  req.query.limit = '3';
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  req.query.page='3'
  req.query.val='4'
  // Passing the modified req.query object to the next middleware function or route handler
  next();
}

// Here req.query will have the modified values set by the aliasTopTours middleware if we call "/get-top-tours"
const getAllTours = async (req, res) => {
  // console.log("the user is :- ",req.user)
 try {
  console.log(req.query);
  // console.log(req.query.limit)
  //! To execute a find operation that has no query criteria, you can pass an empty query or omit the query document in your find method parameters.
  //! The following operations both return all documents in the "Tour" collection:

  //! const allTours = await Tour.find({})
  // * or , this both give all the documents present in the Tour collection 
  // const allTours = await Tour.find()

  // BUILDING 
  // 1A) FILTERING 

  // if (queryObj.hasOwnProperty('limit')) {
  //   delete queryObj.limit;
  // }
  // if (queryObj.hasOwnProperty('sort')) {
  //   delete queryObj.sort;
  // }

  const queryObj = {...req.query}
  const excludedQuery = ['sort','page','limit','fields']
  excludedQuery.forEach(ele => delete queryObj[ele] )
   

  // 1B) ADVANCE FILTERING 
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(lte|lt|gte|gt)\b/g ,match => `$${match}`)
  // console.log(JSON.parse(queryStr));
  // console.log(queryObj);

  let query =  Tour.find(JSON.parse(queryStr))
  

  // B) Sorting:- 
  if(req.query.sort){
    //! Two method :-  sort({price:5000 , ratingsAverage}) , or sort("price ratingsAverage")
    // console.log(req.query) //! we will get this :- Note :- here after comma space is not given { sort: '-price,ratingsAverage' }
    const sortBy = req.query.sort.split(",").join(" ");
    // console.log(sortBy)
    query=query.sort(sortBy)
  }
  
  // C) Field Limiting :- 

  // console.log(req.query);  // ! output { price: { gte: '1500' }, fields: 'name,duration' }
  // console.log(typeof(req.query.fields)); // type will be string 
  if(req.query.fields){
    //! Two methods:-  select({price:5000 , name:"uttu"}) , or select("price name duration etc")
    const fields = req.query.fields.split(",").join(" ");
    query=query.select(fields)  // !select("filter1 filter2"):- Specifies which document fields to include or exclude (also known as the query "projection")
  }else{
    query=query.select("-__v")  // Here -__v means it will select __v and then do minus , that means it doesnot send the __v to the client and expcept __v it will select all the fields
  }

  // D) Pagination :- 
  const page = parseInt(req.query.page) || 1  // Current page number, default is 1
  const limit = parseInt(req.query.limit) || 10  // Number of documents per page to see, default is 10 (Limit means amount of result we want per page)
  const skip =  (page-1)*limit //Specifies the number of documents to skip.
  
  query = query.skip(skip).limit(limit)

  if(req.query.page){
    const countDocument = await Tour.countDocuments()
    if(skip>countDocument) throw new Error("This page does not exist")
  }


  const allTours = await query

  return res.status(200).json({
    status:"success",
    result:allTours.length,
    data:{
      tours: allTours
    }
  })

 } catch (error) { 
  console.log("Error from getAllTours Contoller ",error.message);
  return res.status(400).json({
    status:"fail",
    message:error
  })
 }
}
// const getAllTours = factory.getAll(Tour)

// const createTour =async (req, res) => {
//   try {
//     const newTour = await Tour.create(req.body);

//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour : newTour
//       },
//     });

//   } catch (error) {
//     console.log("Error from createTour Controller",error.message);
//     return res.status(400).json({
//       status:"fail",
//       message:error
//     });
//   }
// };
const createTour = factory.createOne(Tour);

// const getTours = async (req, res) => {

//   // !const particularTour = tours.filter((val)=>{
//   //   return val.id == id
//   // })
//   // ! or
//   // ! It returns the value of the first element in the array that satisfies the provided testing function, or undefined if no elements pass the test.
//   //! eg:-  const particularTour = tours.find((ele) => ele.id === parseInt(id));

//   try {
//     // const tour = await Tour.findById({ _id : req.params.id});
//     // or is same as ,

//     //!  "populate" typically refers to the process of automatically replacing the specified paths in the document with document(s) from other collection(s). To simplify queries when you need related data from different collections.  It's used to reference documents in other collections and pull in the data from those referenced documents.
//     // ! we populates the guides array in schema 
//     const tour = await Tour.findById({_id:req.params.id}).populate('reviews')
//     // console.log(tour)

//     // const tour = await Tour.findOne({_id:req.params.id});
    
//     return res.status(200).json({
//       status:"success",
//       data:{
//         tour
//       }
//     });
//   } catch (error) {
//       console.log("Error from getTours Controller",error.message);
//       return res.status(400).json({
//         status:"fail",
//         message:"Invalid data sent "
//       })
//   } 
// };
const getTours = factory.getOne(Tour,"reviews")


// const updateTour = async (req, res) => {
//   try {
//     // const tour = await Tour.findByIdAndUpdate({_id:req.params.id},req.body,{new:true});
//     // !or  is same as ,
//     const tour = await Tour.findOneAndUpdate({_id:req.params.id},req.body,{
//       new:true,
//       runValidators:true
//       // ! runValidators "true" krne se is Tour wale model ka jo bhi schema hoga wo doobara check hoga , uske bad update hoga 
//       // ! eg:- koi update kr rha hai tour ko aur usne price ko Number ki jagah string me de diya to runValidators eroor through kr dega
//     })  
//     //! { new: true }: When you set this option to true, findByIdAndUpdate() returns the updated document after applying the modifications. 
//     //! This can be convenient because you immediately have access to the updated data without needing to perform an additional query.
    
//     return res.status(200).json({
//       status:"success",
//       data:{
//         tour
//       }
//     })
//   } catch (error) {
//     return res.status(400).json({
//       status:"fail",
//       message:"Invalid data sent "
//     }) 
//   }
// };
const updateTour = factory.updateOne(Tour)


// const deleteTour = async (req, res) => {
//   try {

//     // const tour = await Tour.findOneAndDelete({_id:req.params.id})
//     // ! is same as 
//     // await Tour.deleteOne({_id:req.params.id})
//     //  ! is same as 
//     const exist = await Tour.findByIdAndDelete(req.params.id)
    
//     if(!exist){
//       return res.status(404).json({
//         status:"fail",
//         message:"Invalid tour id"
//       })
//     }

    
//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       status:"fail",
//       message:"Invalid data sent "
//     });
//   }
// };
const deleteTour = factory.deleteOne(Tour) ;



// ! Doing mongodb aggregation pipelining :- the data returned from a pipeline after processing is always an array of documents.
//  Each object in aggrgate fucntion called as stages and , always the processed data will pass to the next stages
const getTourStats = async(req,res)=>{
  const stats = await  Tour.aggregate([
    {
      $match :{ratingsAverage :{ $gte:4.5 } }
    },
    // {
    //   $group : { // Groups documents together and performs calculations on each group.
    //     _id:null,  // when we use null it will Group all documents together into a single document
    //     totalTour : {$sum:1}, // ! cacluating total tour present by doing simple logic , ie, when each of the document passing through this pipeline we just simply do sum and icrement by 1 
    //     numRating : {$sum:'$ratingsQuantity'},
    //     avgRating : {$avg:'$ratingsAverage'},
    //     avgPrice : {$avg :'$price'},
    //     minPrice : {$min:'$price'},
    //     maxPrice : {$max:'$price'}
    //   }
    // }
    {
      $group : {
        _id : "$difficulty",
        totalTour : {$sum:1}, // ! cacluating total tour present by doing simple logic , ie, when each of the document passing through this pipeline we just simply do sum and icrement by 1 
        numRating : {$sum:'$ratingsQuantity'},
        avgRating : {$avg:'$ratingsAverage'},
        avgPrice : {$avg :'$price'},
        minPrice : {$min:'$price'},
        maxPrice : {$max:'$price'}
      }
    },
    {
      $sort : { avgPrice : 1}  //  1 is ascending and -1 is descending.
    },
    // {  // we can also use any stages twice 
    //   $match : { _id: {$ne: 'easy'},
    // }
  ])
  console.log(stats);
  return res.status(200).json({
    status:"success",
    stats
  })
}


      


// Calculating the busiest month of a year
const getMonthlyPlan = async (req,res)=>{
  try {
    const year = req.params.year *1 ;

    const data = await Tour.aggregate([
      { // it will return one tour for each startDate element
        $unwind : {path : '$startDates'},  // similar to :- $unwind : "$startDates"  i.e, The { path: <FIELD> } syntax is optional.  
      },
      // selecting all documents of a particular year that was passed in 
      {
        $match : {
          startDates : {
            $gte : new Date(`${year}-01-01`), 
            $lte : new Date(`${year}-12-31`)      
          } 
        }
      },
      {
        $group : { //! $month is a mongoDB aggregation operator , which  Returns the month of a date as a number between 1 and 12.
          _id : { $month : "$startDates"},
          totalTour : {$sum : 1},
          tours: {$push : {name : '$name' , price : '$price'} }, //! $push returns an array of all values that result from applying an expression to documents. OR we can simply do tour : { $push : '$name' }
         
        }
      },
      {
        $addFields : { month : `$_id`}
      },
      {
        $limit : 12
      },
      {  // !  $project aggregation stage passes only the specified fields along to the next aggregation stage. We use a 1 to include a field and 0 to exclude a field.
        $project : {
          _id : 0,
        }
      },
      {
        $sort : { "totalTour" : 1}
      }
      
      // {
      //   $match : {
      //     startDates:{
      //       $and : [
      //         {startDates : {$gte : new Date(`${year}-01-01`)}},
      //         {startDates : {$lte : new Date(`${year}-12-31`)}}
      //       ]
      //     }
      //   }
      // }
      
    ])

    return res.status(200).json({
      status:"success",
      total:data.length,
      data,
    })

  } catch (error) {
    return res.status(404).json({
      status:"fail",
      message : error.message
    })
  }
}

module.exports = {
  getAllTours,
  deleteTour,
  updateTour, 
  createTour,
  getTours,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  updateTourImages,
  resizingTourImages
};
