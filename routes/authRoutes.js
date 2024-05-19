const express = require('express');
const router = express.Router();
const db = require('../db/index');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();
const jwtSecret = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const generateOTP = () => {
  const length = 4; 
  const digits = '0123456789'; 

  let otp = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    otp += digits[randomIndex];
  }

  return otp;
};


router.post('/register', async (req, res) => {
  const { username, password, email, age, gender, height, kilogram } = req.body;
  const existUserQuery = 'SELECT * FROM users WHERE email = ? OR username = ?';

  db.query(existUserQuery, [email, username], async (err, results) => {
    if (err) {
      console.error('MySQL query error: ', err);
      return res.status(500).json({ message: "Server error", status: -5 });
    }

    if (results.length > 0) {
      return res.json({ message: "Email or username already exists.", status: -4 });
    } else {
      if (username && password && email && age && gender && height && kilogram) {
        try {
     
          const otp = generateOTP();
          const insertOtpQuery = 'INSERT INTO otp_verification (email, otp) VALUES (?, ?)';

          db.query(insertOtpQuery, [email, otp], (err, results) => {
            if (err) {
              console.error('MySQL query error: ', err);
              return res.status(500).json({ message: "Server error", status: -5 });
            }

   
            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: email,
              subject: 'Your OTP Code - NutriTrack',
              text: `Your OTP code is ${otp}`,
            };

            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error('Error sending OTP email: ', error);
                return res.status(500).json({ message: "Error sending OTP email", status: -2 });
              } else {
                return res.status(200).json({ message: 'OTP sent to your email', status: 1 });
              }
            });
          });
        } catch (error) {
          console.error('Error generating OTP: ', error);
          return res.status(500).json({ message: "Server error", status: -5 });
        }
      } else {
        return res.status(400).json({ message: "Please fill all required fields.", status: -1 });
      }
    }
  });
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required", status: -1 });
  }

  const selectUserQuery = 'SELECT * FROM users WHERE email = ?';

  db.query(selectUserQuery, [email], async (err, results) => {
    if (err) {
      console.error('MySQL query error: ', err);
      return res.json({ message: "Server error", status: -5 });
    }

    if (results.length === 0) {
      return res.json({ message: "Invalid email or password", status: -1 });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.json({ message: "Invalid email or password", status: -1 });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '1h' });

    return res.status(200).json({ message: 'Login successful', token, status: 1, data: user });
  });
});


router.post('/verify-otp', async (req, res) => {
  const { email, otp, username, password, age, gender, height, kilogram } = req.body;

  if (!email || !otp || !username || !password || !age || !gender || !height || !kilogram) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const selectOtpQuery = 'SELECT * FROM otp_verification WHERE email = ? AND otp = ?';

  db.query(selectOtpQuery, [email, otp], async (err, results) => {
    if (err) {
      console.error('MySQL query error: ', err);
      return res.json({ message: "Server error" });
    }

    if (results.length > 0) {

      try {
        let hashedPassword = await bcrypt.hash(password, 12);
        const insertUserQuery = `INSERT INTO users (username, password, email, age, gender, height, kilogram) VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(insertUserQuery, [username, hashedPassword, email, age, gender, height, kilogram], (err, results) => {
          if (err) {
            console.error('MySQL query error: ', err);
            return res.json({ message: "Server error" });
          }


          const deleteOtpQuery = 'DELETE FROM otp_verification WHERE email = ?';
          db.query(deleteOtpQuery, [email], (err, results) => {
            if (err) {
              console.error('MySQL query error: ', err);
              return res.status(500).json({ message: "Server error" });
            }

            return res.status(200).json({ message: 'User registered successfully', status: 1 });
          });
        });
      } catch (hashError) {
        console.error('Password hashing error: ', hashError);
        return res.status(500).json({ message: "Server error" });
      }
    } else {
      return res.json({ message: "Invalid OTP", status: -1 });
    }
  });
});

router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required", status: -1 });
  }

  const selectUserQuery = 'SELECT * FROM users WHERE email = ?';

  db.query(selectUserQuery, [email], async (err, results) => {
    if (err) {
      console.error('MySQL query error: ', err);
      return res.status(500).json({ message: "Server error", status: -5 });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Email not found", status: -1 });
    }

    try {
      const otp = generateOTP();
      const insertOtpQuery = 'INSERT INTO otp_verification (email, otp) VALUES (?, ?) ON DUPLICATE KEY UPDATE otp = ?, created_at = CURRENT_TIMESTAMP';

      db.query(insertOtpQuery, [email, otp, otp], (err, results) => {
        if (err) {
          console.error('MySQL query error: ', err);
          return res.status(500).json({ message: "Server error", status: -5 });
        }

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your OTP Code - NutriTrack',
          text: `Your OTP code is ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending OTP email: ', error);
            return res.status(500).json({ message: "Error sending OTP email", status: -2 });
          } else {
            return res.status(200).json({ message: 'OTP sent to your email', status: 1 });
          }
        });
      });
    } catch (error) {
      console.error('Error generating OTP: ', error);
      return res.status(500).json({ message: "Server error", status: -5 });
    }
  });
});




module.exports = router;
