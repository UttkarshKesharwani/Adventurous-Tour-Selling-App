const User = require("../Models/userSchema");
const generatePutObjectURL = require("../Utils/awsServices");
const upload = require("../Utils/multerConfig");
const sharp = require('sharp') // library for image processing bxoz sometimes user upload the image which is not square and having large size/pixels







const uploadUserProfile = upload.single('photo');

const resizingImage = async (req,res,next)=>{

  if(!req.file) return next();

  req.file.filename = `${req.user.name}-${req.user.id}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600,600)
    .toFormat('jpeg')
    .toFile("ProfilePhotoUploads/upload")

  next()
}

const filterObject = (obj ,...allowedFields)=>{
  let finalFilteredObject = {};
  Object.keys(obj).forEach(ele=>{    //! Object.keys(req.body) returns an array of strings that contains all keys  
    if(allowedFields.includes(ele)){
      finalFilteredObject[ele] = obj[ele]
    }
  })
  return finalFilteredObject;
}
 
const getAllUser = async (req, res) => {
  const user = await User.find()
  res.status(200).json({
    status: 'success',
    data: {
      user
    },
  });
};
const createUser = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: 'soon update create User route',
    },
  });
};
const getUser = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: 'soon update get particular users routes',
    },
  });
};

//! Basically we will update all profile fields (excepts updating password) like user details :-  name ,email,username 
const updateMe =async (req, res) => {

 try {

  // 1) Create error if user POST password data 
  if(req.body.password || req.body.confirmPassword){
    return res.status(400).json({
      error :"This route is not implemented for to update the password . Please use /updateMyPassword route "
    })
  }
  
   // 3) filter unwanted fields names that are not allowed to update 
  const filteredBody= filterObject(req.body , 'name','email')
  // if(req.file) filteredBody.photo = req.file.filename

  // 2)  Update user document 
  const userExist = await User.findByIdAndUpdate(req.user.id, filteredBody , {
    new:true,
    runValidators:true
  })
    
  res.status(200).json({
    status: 'success',
    data: {
      user: userExist
    },
  });

 } catch(error) {
  res.status(404).json({
    status:"fail",
    error:error.message
  })
 }
};

const uploadPhoto = async (req,res)=>{

  if(!req.file) return res.status(404).json({message:"Please select a file"});
  // console.log(req.file);
  const url = await generatePutObjectURL(req.file);
  return res.status(200).json({
    status:"success",
    url
  })
}

const updateImageInfoInDB = async (req,res)=>{
  const {filename}= req.body
  const photo = `https://S3.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_S3_BUCKET_NAME}/Profile/${filename}`
  const user = await User.findByIdAndUpdate(req.user.id , {photo} , {new:true})
  return res.status(200).json({
    status:"success",
    user
  })
}



const deleteUser = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {active : false})
  res.status(200).json({
    status: 'success',
    data :null
  });
};

 
const getMe = async (req,res)=>{

  const user = await User.findById(req.user.id);

  return res.json({
    status:"success",
    results: user.length,
    data: {
      user
    }
  }) 
}

module.exports = {
  deleteUser,
  updateMe,
  getUser,
  getAllUser,
  createUser,
  getMe,
  uploadUserProfile,
  resizingImage,
  uploadPhoto,
  updateImageInfoInDB,
};
