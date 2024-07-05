const rateLimit = require('express-rate-limit');
const path = require('path')
const mongooseSanitize = require('express-mongo-sanitize');
const sanitizeHtml = require('sanitize-html');
const express = require('express');
const userRouter = require('./Routes/userRoutes');
const tourRouter = require('./Routes/tourRoutes');
const connetToDatabase = require('./Utils/DB');
const authRouter = require('./Routes/authRouter');
const reviewRoter = require('./Routes/reviewRouter');
require('dotenv').config();
const app = express();
const port = 3000 || process.env.PORT ;
const cors = require('cors');


const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);




// Setting express app 
app.set('view engine','pug');
app.set('views',path.join(__dirname , 'views'))
app.use(express.static(path.join(__dirname,'views')));



// *Global Middleware

app.use(cors())

// Rate limiting for the particular api
// const limit = rateLimit({
//   windowMs:60*60*100,  // How long to remember requests for, in milliseconds.
//   limt:10000, /// Limit each IP to 100 requests per `windowMs`
//   statusCode:429,
//   message:"Too many request from this IP , please request it after one hour "
// })

// Apply the rate limiting middleware to all requests. 
//! app.use(limit)
// this will affect all routes starting with api
// app.use("/api",limit)  


// Body parser , Reading the incoming data from req.body
app.use(express.json());


// Data sanitization against NoSQL Injection query Injection 
//! By default, $ and . characters are removed completely from user-supplied input in the following places :- req.body,req.params,req.headers, req.query
app.use(mongooseSanitize());

// Data sanitization against cross side scripting (XSS):-  Middleware to sanitize user input
app.use((req, res, next) => {
  // Function to recursively sanitize an object
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeHtml(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    }
  };
  // Sanitize the request body
  if (req.body) {
    sanitizeObject(req.body);
  }
  // Sanitize the request query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }
  // Sanitize the request params
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
});

 







// app.get('/api/v1/tours',getAllTours);
// app.get("/api/v1/tours/:id",getTours)
// app.post('/api/v1/tours', createTour );
// app.patch("/api/v1/tours/:id",updateTour) 
// app.delete("/api/v1/tours/:id",deleteTour)

app.get("/",(req,res)=>{
  res.status(200).render('test.pug',{
    tour : "the forest camper",
    user:"Uttkarsh"
  })
})

 
app.use('/api/v1/',authRouter)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/review',reviewRoter);

// Handling unhanded routes :- It catch-all route handler for handling requests to any undefined routes in your Express application. It ensures that if a client tries to access a route that isn't defined in your application, they receive a 404 error response in JSON format
app.all("*",(req,res,next)=>{
  const err = new Error(`Can't find the ${req.originalUrl} on this server`);
  err.status = err.status  || "fail",
  err.statusCode =  404
  next(err)
})

app.use((err,req,res,next)=>{
  // console.log(err.status , err.statusCode)
  res.status(err.statusCode).json({
    status:err.status,
    error:err.message
  })
})

app.listen(port, async  () => {
  await connetToDatabase() ;
  console.log(`server is running on port ${port}`);
});





// python manage.py runserver
