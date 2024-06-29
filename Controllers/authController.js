const User = require("../Models/userSchema")
const jwt = require('jsonwebtoken');
const {createSendToken, generateToken} = require("../Utils/generatingToken");
const bcrypt = require('bcrypt')
const crypto = require('crypto');
// const sendEmail = require("../Utils/email");
const { options } = require("sanitize-html");
const Email = require("../Utils/email");
require('dotenv').config();


const signup = async (req,res)=>{
  try {
    const {name , email , password , photo , confirmPassword ,role} = req.body
    let userExist = await  User.findOne({email:req.body.email}).select('active');
    if(userExist){
      if(!userExist.active){
        return res.status(200).send("Your account is inactive . Please login and reactivate your account")
      }
      return res.status(401).json({
        status:"fail",
        message:"User already exist"
      })
    }

    //* Note:- bcrypt is done in the usermodel schema 
    const user = await User.create({
      name , password , email , photo , confirmPassword, role
    });

    user.password = undefined ; // Do not send the password to the client side
    user.active = undefined ; // also do not send whether is active/nonactive

    // * Sending welcome mail to the user 
    const url = `${req.protocol}//:${req.get('host')}/me`;
    const sendMail =  new Email(user,url)
    await sendMail.sendWelcome()

    createSendToken(user,201,res,req);

  } catch (error) {
    console.log(error.message)
    return res.status(400).json({
      status:"fail",
      error:error.message
    })
  }
}


const login = async (req,res,next)=>{
  const{email,password} = req.body
   // 1) Check if email and password exist

   if (!email || !password) {
    const err = new Error('Password or email cannot be blank');
    err.status = 'fail';
    err.statusCode = 400; // 400 for Bad Request
    return next(err);
  }

  // 2) Check if user exists
  const userExist = await User.findOne({ email }).select("+password +active"); // ! here i select('password') because in model in turn this property  as false 

  // if (!userExist) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'User does not exist, please register yourself'
  //   });
  // }

  console.log(userExist);

  if(!userExist){
    return res.status(404).json({
      status: 'fail',
      message: ' 92 User does not exist, please register yourself'
    });
  }


  // Check if userExist is inactive , then simply set as active using sending mail 
  if(!userExist.active){
    try {
      const token = generateToken(userExist._id)
      const resetURL = `${req.protocol}://${req.get('host')}/api/v1/activation/${token}`
      const link = `${resetURL}`
      const option = {
        email,
        subject:'Reactivate your account',
        message : `Hi ${userExist.name},

                We received a request to reactivate your account. If you initiated this request, please click the link below to complete the reactivation process:

                ${link}

                If you did not request to reactivate your account, please disregard this email or contact our support team immediately.

                Thank you,
                Your Company Name`,
      } 
      sendEmail(option)
      return res.status(200).send("We have send an account activation link in you email . kindly check it")
    } catch(error) {
      return res.send(error.message)
    }
  }

  // 3) Check if password is correct , defining correctPassword method in model , and we can acess model using instance of model 
  if (! (await userExist.correctPassword(password , userExist.password)) ) {
    return res.status(401).json({
      status: 'fail',
      message: 'Incorrect password'
    });
  }

  // 4) If everything is ok, then send token to client 
  createSendToken(userExist,200,res,req) //! send response to client from inside function 
}

const protect =async  (req,res,next)=>{
  //!* In HTTP requests, headers are used to provide additional information about the request or the client making the request. To handle authorization, you can use headers like Authorization.
  // console.log(req.headers)

  try {
    //! 1) Getting Token and checking if it exist or not 
  let token ;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token = req.headers.authorization.split(" ")[1]
  }
  // console.log(token);
  if(!token){
    const err = new Error("you are not logged in! please login again");
    err.status = err.status  || "fail",
    err.statusCode =  404
    return next(err)
  }

  //! 2) Verification token (checking whether thet token is already expired/invalid or checking whether the token is manipulated by someone)
  const decoded = jwt.verify(token,process.env.JWT_SECRET)
  // console.log("line  103",decoded);

  //! 3) check if the user exists (ie, user got the valid token but he delete the account permanenetly , immideatly after registering or login into the account )
  const userExists = await User.findById(decoded.id).select("+password");
  // console.log("user",userExists);
  if(!userExists){
    return res.status(401).json({
      status:'fail',
      message:"line 111 User not exist"
    })
  }
    
  //! 4)   // 4) Check if user changed password after the token was issued,  check the password ,  after getting the token is same or has been Changed for this we will send the password as a payload in the token 
  if(userExists.checkingChangePasswordAfter(decoded.iat)){
    return res.status(401).json({
      status:"fail",
      message:"password has been changed please login again"
    })
  }

  //!  Access user information via req.user 
  //! This is done because :- 
  // 1. Access User Information in Route Handlers
  // 2. Maintain Consistency Across Middleware , If multiple middleware functions need to access or modify the authenticated user, attaching it to req.user provides a consistent and convenient way to pass this information.
  // 3. Simplify Code and Improve Readability
  // 4. Enhance Security
  req.user = userExists ; // This line of code attaches the authenticated user object to the request object (req), making it accessible in subsequent middleware and route handlers during the processing of that request. Here’s why this is useful and important:

  next();

  } catch(error) {
    return res.status(401).json({
      status:"fail",
      error:error.message
    })
  }
}


// ! another way 
// const restrictTo = async (req,res,next)=>{
//   console.log(req.user.role);
//   if(req.user.role.includes('admin') || req.user.role.includes('lead-tour')){
//      return next();
//   }
//   return res.status(401).json({
//     status:"fail", 
//     message:"you are restricted to perform this action"
//   })
// }

const restrictTo = (...roles)=> {
  // console.log(roles);
  return async (req,res,next)=>{
    // console.log(req.user)
    if(roles.includes(req.user.role)){
      return next();
    }
    return res.status(401).json({
      status:"fail", 
      message:"you are restricted to perform this action"
    })
  }
}


// User will sends the email and recieves email for changing the password 
// * Steps to Implement forgetPassword Controller:- 
// Receive the Request:- Accept the user's email or username as input to identify the account for password reset.
// Validate the Input:- Ensure the input (email or username) is valid and exists in your database.
// Generate a Secure Token:- Create a unique, time-limited token that will be used to verify the password reset request.
// Store the Token:- Save the token in the database with an expiration time, associated with the user account.
// Send the Token:- Email the token to the user with a link to a password reset page.
// Handle the Password Reset Request:- Create an endpoint to accept the token and the new password.Verify the token, reset the password, and invalidate the token.
const forgetPassword = async (req,res)=>{

  if(!req.body.email){
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // 1) Get the email from user and check whether the particular exist or not 
    const userExist = await User.findOne({email:req.body.email})
    if(!userExist){
      return res.status(400).json({
        status:"fail",
        message:"User not exist with this email"
      })
    }

    // 2) Generating a random cryptographic token
    const resetToken = crypto.randomBytes(32).toString('hex');
    userExist.passwordChangedAt = Date.now()
    userExist.passwordResetToken = crypto.createHash('sha-256').update(resetToken).digest('hex'); // hashing the random crypto before saving into db
    userExist.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await userExist.save({validateBeforeSave:false});  //! before saving it vaslidate the user schema , user.save() is designed to save the existing user object with its current properties.

    try {

      
      const resetURL = `${req.protocol}://${req.get('host')}/api/v1/resetPassword/${resetToken}` 
      const message = `click this link ${resetURL} to reset your password`

      // await sendEmail({
      //   email:userExist.email,
      //   message : message,
      //   subject :"Your password reset is valid for 10 min only"
      // })

      const sendForgetEmail = new Email(userExist , resetURL )
      sendForgetEmail.passwordReset();
  
      return res.status(200).json({
        status :"success",
        message: "Token has been sent to email"
      })
  
    } catch (error) {
      userExist.passwordChangedAt = undefined
      userExist.passwordResetToken = undefined
      userExist.passwordResetExpires = undefined 
      userExist.save({validateBeforeSave : false});

      const err = new Error("Something wrong while sending the error . Please try again after sometime");
      err.status = err.status  || "fail",
      err.statusCode =  500
      return next(err)

    }
  } catch (error) {
    return res.status(400).json({
      status:"fail",
      message:error
    })
  }
}

const resetPassword = async (req,res)=>{
 try {
   // 1) get user based on the token , // ! Remember token is stored in encrpted form and we cannot decrypt therefore , we need to again encypt the incoming token and then compared the encrypted token with the database 
   const hasedToken  = crypto.createHash('sha256').update(req.params.token).digest('hex');
  //  console.log(hasedToken)
   const user = await User.findOne({
    passwordResetToken:hasedToken,
    passwordResetExpires : {$gt : Date.now()}
   })
   
   // 2) if token is not expired , and there is user  then set the new password for user 
   if(!user){
    return res.status(404).json({
      status:"fail",
      message:"Invalid token"
    })
   }

   // 3) Update changePasswordAt property for the user 
   if(req.body.password != req.body.confirmPassword){
    return res.status(400).json({
      status:"fail",
      message:"Incorrect Password(confirm password typo)"
    })
   }
   user.password = req.body.password
   user.confirmPassword = req.body.confirmPassword
   user.passwordResetToken  = undefined
   user.passwordResetExpires  = undefined
   user.passwordChangedAt = Date.now() 
   await user.save(); // ! here we do not turn of becoause it will validate the password and confirm password

   // 4) Log the user in , send JWT 
  //  const token  = generateToken(user._id , user.password)
  //  console.log(token);
  req.message = "successfully updated password"
  createSendToken(user,200,res,req)
   

  //  return res.status(200).json({
  //   status:"success",
  //   message:"Password updated successfully",
  //   token
  //  })
 
 } catch (error) {
  console.log(error);
 }
}

const updatePassword = async (req,res)=>{

  // 1) Authenticate the User:- Ensure the user is authenticated and authorized to update their password. This typically involves checking their current session or JWT token.
  const user =await  User.findById(req.user.id).select("+password")

  // 2) Validate Current Password:- Ask the user to provide their current password to verify their identity before allowing a password change.
  // const correctPassword = await bcrypt.compare(req.body.currentPassword,user.password);
  // console.log(correctPassword);
  // if(!correctPassword){
  //   return res.status(400).json({
  //     status:"fail",
  //     message:"Invalid current password"
  //   })
  // } // Another way using mongoose instance 
  if(!(await user.correctPassword(req.body.currentPassword,user.password))){
    return res.status(400).json({
      status:"fail",
      message:"Enter correct password to update you password"
    })
  }

  //3) Validate New Password:- Ensure the new password meets your application's security requirements (e.g., length, complexity, ensure comfirm and new password is same ).
  if(req.body.confirmPassword !== req.body.confirmNewPassword){
    return res.status(400).json({
      status:"fail",
      message:"New password are mismatched (typo)"
    })
  }

  // 4) Hashing(done by mongoose pre-save method) and update the new password in the database
  user.password =  req.body.confirmPassword
  user.confirmPassword = req.body.confirmNewPassword
  user.save();
  // findbyIdAndUpdate will not work

  // 5) Log user in ,  resend the JWT
  createSendToken(user,200,res,req)

}

const reactivatingAccount = async (req,res)=>{
  try {

    const decoded  = jwt.verify(req.params.token,process.env.JWT_SECRET)

    const user = User.findById(decoded.id);
    if(!user){
      return res.status(400).json({ status: 'fail', message: 'User not found' });
    }

    await User.findByIdAndUpdate(decoded.id , {active:true},{new:true})

    res.status(200).json({
      status: 'success',
      message: 'Account activated successfully . Please login again',
    });

  } catch(error) {
    return res.status(404).json({
      status:"fail",
      message:error.message
    })
  }
}


// ! simply we are not going to delete the whole document of a user, what we simply do is to set active as fasle 
const deleteMe = async (req,res,next)=>{
  await User.findByIdAndUpdate(req.user.id , {active:false} , {new : true})
  return res.status(204).json({
    status:"success",
    data:null
  })

}

module.exports = {
  signup,login,protect,reactivatingAccount,restrictTo,forgetPassword,resetPassword,updatePassword,deleteMe
} 
