const multer= require('multer')





// const multerStorage = multer.diskStorage({
//   destination:(req,file,cb)=>{
//     cb(null,"ProfilePhotoUploads/upload")
//   },
//   filename:(req,file,cb)=>{
//     const ext = file.mimetype.split("/")[1];
//     cb(null,`${req.user.name}-${req.user.id}-${Date.now()}.${ext}`)
//   }
// })
const multerStorage = multer.memoryStorage()

const multerFilter = (req,file,cb)=>{
  if(file.mimetype.startsWith('image/')) cb(null,true);
  else cb("Please upload imaege only");
}


// const upload = multer({dest:'public/user/images'})
const upload = multer({
  storage:multerStorage,
  fileFilter:multerFilter
})

module.exports = upload