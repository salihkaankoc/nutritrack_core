const axios = require('axios');
const express = require('express');
const router = express.Router();
const db = require('../db/index');


router.get("/all-foods", async (req, res) => {
    const foodQuery = "SELECT * FROM meals"
  try{
    
    db.query(foodQuery, async (err, results) => {
        if(err) {
            return res.status(500).json({message: "Can not get meals", status: -4})
        }
        return res.status(200).json(results);
    })
  } catch(e) {
    return res.status(500).json({ message: "Server error", status: -5 });
    
  }
});

module.exports = router;
