const express = require('express');
const { signup, login, forgetPassword ,reactivatingAccount,resetPassword, updatePassword, protect, deleteMe} = require('../Controllers/authController');
const authRouter = express.Router();


authRouter.put("/activation/:token",reactivatingAccount)
authRouter.post("/signup",signup)
authRouter.post("/login",login)
authRouter.post("/forgetPassword",forgetPassword).patch("/resetPassword/:token",resetPassword).patch("/updateMyPassword",protect,updatePassword).delete("/deleteMe",protect,deleteMe)


module.exports = authRouter