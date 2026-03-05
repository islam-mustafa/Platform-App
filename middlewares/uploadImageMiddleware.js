const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const ApiError = require('../utils/apiError');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// ✅ إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ استخدم memoryStorage فقط
const storage = multer.memoryStorage();

// ✅ فلترة الصور
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new ApiError('Only images allowed', 400), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

exports.uploadSingleImage = (fieldName) => upload.single(fieldName);
exports.uploadMixOfImages = (arrayOfFields) => upload.fields(arrayOfFields);


// const multer = require('multer');
// const ApiError = require('../utils/apiError');

// const multerOptions = ()=>{
//     // 2- Memory storage engine
    
//     const multerStorage = multer.memoryStorage();
    
//     const multerFilter = function (req, file ,cb){
//         if(file.mimetype.startsWith('image')){
//             cb(null , true)
//         }else {
//             cb(new ApiError('only images allowed',400 ), false)
//         }
//     }
//     const upload = multer({storage: multerStorage, fileFilter: multerFilter})
//     return upload
//     };

// exports.uploadSingleImage = (fieldName)=> multerOptions().single(fieldName)


// exports.uploadMixOfImages=(arrayOfFileds)=>multerOptions().fields(arrayOfFileds)
    