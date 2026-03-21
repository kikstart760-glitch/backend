const user = require('../models/authModel');
const {middleware, generateToken} = require('../Middleware/Middleware');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

exports.signUp = async (req, res, next) => {
    try {
        const { name, email, phone, location, passcode, password } = req.body;
        if(!name || !email || !phone || !location || !passcode || !password){
          return next(
            res.status(400).json({
              status:"fail",
              message:"Please provide all required fields!!!"
            })
          );
        }
        
        const checkexist = await user.findOne({$or: [{email}, {phone}]});
        
        if(checkexist){
          return next(
            res.status(400).json({
              status:"fail",
              message:"User already exist with this email or phone number"
            })
          );
        }
        
        const salt = await bcrypt.genSalt(10)
        const hashpassword = await bcrypt.hash(password, salt);

        const userData = new user({name, email, phone, location, passcode, password:hashpassword });
        await userData.save();

        const payload = {
          _id:userData._id
        }
        const token = generateToken(payload);
        console.log(token)

        //token implementation--------->jsonwebtoken

        res.status(201).json({
            status: "success",
            message: "User Created",
            data: userData
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
            message: err.message
        });
    }
};

exports.login = async (req, res, next) => {
  try {
    const { email,phone, password } = req.body;

    if (!email && !phone || !password) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "Please provide email or phone and password!!!",
        })
      );
    }

    const checkexist = await user.findOne({ $or: [{ email }, { phone }] });

    if (!checkexist) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "User dose not exist",
        })
      );
    }
    const checkpassword = await bcrypt.compare(password, checkexist.password);
    // ---------jwt token
    if(!checkpassword){
     return(
        res.status(400).json({
          status: "fail",
          message: "Worng Password",
        })
      );
    }

    const token = generateToken({ _id: checkexist._id });

    console.log(token);

    res.status(200).json({
      token,
      data:checkexist
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.forgetPassword = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    if(!email && !phone){
      return next(
        res.status(400).json({
          status:"fail",
          message:"Please provide Email or Phone !!!"
        })
      );
    }
      
    const checkexist = await user.findOne({ $or: [{ email }, { phone }] });
    
    if (!checkexist) {
      return next(
        res.status(400).json({
          status: "fail",
          message: "User dose not exist",
        })
      );
    }

    const transporter = nodemailer.createTransport({
      host:'smtp.gmail.com',
      port:587,
      secure:false,
      auth:{
        user:process.env.MY_EMAIL,
        pass:process.env.MY_PASSWORD,
      }
    })

    const generateOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("OTP:",generateOtp);

    checkexist.otp = generateOtp;
    checkexist.otpExpiry = Date.now() + 5 * 60 * 1000;
    await checkexist.save();

    await transporter.sendMail({
      from:process.env.MY_EMAIL,
      to:email,
      subject:'otp',
      text:`Your otp is :${generateOtp} It will expire in 5 minutes. `
    })
    
    const payload = {
      _id:checkexist._id
    }
    const token = generateToken(payload);
    console.log(token)

    //token implementation--------->jsonwebtoken

    res.status(200).json({
      status: "Success",
      message: "Otp send successfully"
    });
  } catch (err) {
      res.status(400).json({
          status: "error",
          message: err.message
      });
  }
};


exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, phone, otp } = req.body;
        if(!email && !phone || !otp){
          return next(
            res.status(400).json({
              status:"fail",
              message:"Please provide email or phone and otp!!!"
            })
          );
        }
        
        const checkexist = await user.findOne({ $or: [{ email }, { phone }] });
        
        if(!checkexist){
          return next(
            res.status(400).json({
              status:"fail",
              message:"User dose not exist"
            })
          );
        }
        
        if (checkexist.otp !== otp) {
          return next(
            res.status(400).json({
              status:"fail",
              message:"Invalid OTP"
            })
          );
        }

        if (checkexist.otpExpiry < Date.now()) {
          return next(
            res.status(400).json({
              status:"fail",
              message:"OTP has expired"
            })
          );
        }

        res.status(201).json({
            status: "success",
            message: "OTP verified successfully",
            data: checkexist,
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
            message: err.message
        });
    }
};


exports.resetPassword = async (req, res, next) => {
    try {

      const { email, phone, password } = req.body;

      if (!email && !phone || !password) {
        return next(
          res.status(400).json({
            status: "fail",
            message: "Please provide email or phone and password!!!",
          })
        );
      }
        const checkexist = await user.findOne({ $or: [{ email }, { phone }] });

        if (!checkexist) {
          return next(
            res.status(400).json({
              status: "fail",
              message: "User dose not exist",
            })
          );
        }

        const checkpassword = await bcrypt.compare(password, checkexist.password);

        if(checkpassword){
        return(
            res.status(400).json({
              status: "fail",
              message: "Password used once",
            })
          );
        }

        const salt = await bcrypt.genSalt(10)
        const hashpassword = await bcrypt.hash(password, salt);

        const  changePassword= await checkexist.updateOne({ password:hashpassword });
        
        const payload = {
          _id:checkexist._id
        }
        const token = generateToken(payload);
        console.log(token)

        console.log(changePassword)

        res.status(200).json({
          status: "Success",
          message: "Password reset successfully",
          data:checkexist
        });
    } catch (err) {
        res.status(400).json({
            status: "error",
            message: err.message
        });
    }
};