const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name:{
      type:String,
      required:[true , "Name field cannot be blank"],
      trim:true,
    },
    password:{
      type:String,
      required:[true , "Password cannot be blank"],
      minlength:[5,"password must be atleast of 5 letter"],  //! same for maxlength
      select:false //! using this property we will not send the property of the use to the client when we get all user route
    },
    confirmPassword:{
      type:String,
      required:[true , "Password confirm your password blank"],
      validate:{
        // this 
        validator : function(el){
          return el === this.password  
        },
        message: 'Passwords are not the same!'
      }
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user'
    },
    // age: {
    //   type: Number,
    //   min: [18, 'Age must be at least 18'],
    //   max: [65, 'Age must be at most 65'],
    //   validate: {
    //     validator: Number.isInteger,
    //     message: '{VALUE} is not an integer value'
    //   }
    // },
    email:{
      type:String,
      required:[true , "Email cannot be blank"],
      trim:true,
      unique:true,
      lowercase:true,
      validate:[validator.isEmail , "Enter a valid email"]
    },
    photo:{
      type:String,
      default : 'placeholder.png'
    },
    //! these property are the optional property :- If a property is not marked as required, it is optional. You can create or update documents without including optional properties, and Mongoose will save the document without those properties. Mongoose will save the document with only the properties you provided
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
      type:Boolean,
      default:true,
      select: false 
    }
  }
)




userSchema.methods.correctPassword = async function(candidatePassword , userPassword){
  return await bcrypt.compare(candidatePassword,userPassword)
}

userSchema.methods.checkingChangePasswordAfter = function(jwtTimeStamp){
  // since 'this' reprents the current document , and we are checking whether the 'passwordChangedAt' exists or not ,if not simply return false  
  if(this.passwordChangedAt){
    let changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000 ,10)
    return changedTimeStamp > jwtTimeStamp;
  }
  return false ;
}

//! The pre-save (Document middleware) middleware in Mongoose runs before a document is saved to the database. This includes both when a new document is created and saved for the first time and when an existing document is updated (if the save method is called).
// only run on .save() and .create()
userSchema.pre('save', async function(next){
  //! we will do not bcrypt the password , if the password is being not modified 
  // If the password field is not modified, proceed to the next middleware 
  if(!this.isModified('password')) return next();

  //! Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password,12);

   //! Remove confirmPassword field , i.e this field will not be save in the database
  this.confirmPassword = undefined

  next();
});


// userSchema.pre(/^find/, async function(next){
//   // this refer to query , bcoz we give /^find/ 
//    this.find({active:true})
//   //  console.log(this.getQuery())    //! getQuery() :- Returns the current query filter in object .
//    console.log("also");
//   next();
// })




const User = mongoose.model("User",userSchema)

module.exports = User