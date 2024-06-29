const mongoose = require('mongoose');
require('dotenv').config()

const DB_STRING = process.env.DATABASE.replace('<password>',process.env.DATABASE_PASSWORD);


const connetToDatabase = async () => {
  try {
    await mongoose.connect(DB_STRING);
    console.log("Database connected successfully"); 
  } catch (err) {
    console.log("Connection failed to DB",err);
  }
}

module.exports = connetToDatabase