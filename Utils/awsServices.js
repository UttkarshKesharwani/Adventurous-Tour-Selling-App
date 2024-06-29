const {PutObjectCommand,GetObjectCommand , S3Client} = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
require('dotenv').config()



const s3Client = new S3Client({
  region:process.env.AWS_REGION,
  credentials:{
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
  }
})


// console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
// console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Loaded' : 'Not Loaded');
// console.log('AWS_REGION:', process.env.AWS_REGION);
// console.log('S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME);


const generatePutObjectURL = async (fileDetails)=>{

  console.log("helo",fileDetails);
  
  const command = new PutObjectCommand({
    Bucket:process.env.AWS_S3_BUCKET_NAME,
    Key:`Profile/${fileDetails.filename}`,
    ContentType:fileDetails.mimetype
  })

  try {
    const url = await getSignedUrl(s3Client,command);
    console.log(url)
    return url;
  } catch(error) {
    console.log(error.message);
  }
}


module.exports = generatePutObjectURL 