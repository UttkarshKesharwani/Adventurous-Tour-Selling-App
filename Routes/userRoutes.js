const express = require('express')
const { getAllUser, uploadPhoto,createUser, updateMe, deleteUser,uploadUserProfile , updateImageInfoInDB, resizingImage ,getUser ,getMe} = require('../Controllers/userController');
const { protect } = require('../Controllers/authController')
const userRouter = express.Router()








userRouter.get("/me",protect,getMe)
userRouter.route("/").get(getAllUser).post(createUser)
userRouter.route("/:id").get(getUser)



userRouter.patch("/updateMe/edit-profile",protect,updateMe)  
userRouter.post("/updateMe/edit-photo",protect,uploadUserProfile,resizingImage,uploadPhoto) // upload.single('photo') will a attach a req.file object and contain info about files
userRouter.post("/updateMe/edit-photo/updateImageInfo",protect,updateImageInfoInDB)
userRouter.delete("/deleteMe",protect,deleteUser)


module.exports = userRouter