const express = require('express');
const db = require('../db/index');
const router = express.Router();


router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const userQuery = "SELECT * FROM users where id = ?"
        db.query(userQuery, [id], async (err, results) => {
            if (err) {
                return res.json({ message: "Server error", status: -5 })
            }
            return res.status(200).json(results);
        })
    } catch (e) {
        return res.json({ message: "Server error", status: -5 })
    }
})
router.get("/meal-records/today/:id", async (req, res) => {
    const id = req.params.id;
    const todayMealRecords = `
    SELECT 
        mr.id,
        mr.food_id,
        fi.name AS food_name,
        mr.quantity,
        fi.calories,
        fi.protein,
        fi.carbohydrates,
        fi.fat
    FROM 
        meal_records mr
    JOIN 
        meals fi ON mr.food_id = fi.id
    WHERE 
        mr.user_id = ? 
        AND DATE(mr.date) = CURDATE();
  `;
  db.query(todayMealRecords, [id], (err, results) => {
    if (err) {
        console.error('MySQL query error: ', err);
        return res.status(500).json({ message: "Server error" });
    }
  
    if (results.length === 0) {
        return res.json({ message: "No meal records found for today." });
    }
  
    return res.status(200).json(results);
  });
  })
  
router.get('/daily-records/:id', async (req, res) => {
    const id = req.params.id;

    try {
        // Kullanıcının bugünkü günlük kaydını çek
        const todayRecordQuery = `
        SELECT 
        SUM(consumed_calories) AS total_consumed_calories,
        SUM(consumed_protein) AS total_consumed_protein,
        SUM(consumed_carbs) AS total_consumed_carbs,
        SUM(consumed_fat) AS total_consumed_fat,
        SUM(burned_calories) AS total_burned_calories,
        COUNT(*) AS total_meals
      FROM daily_records 
      WHERE user_id = ? AND DATE(date) = CURDATE();
    `;


        db.query(todayRecordQuery, [id], (err, results) => {
            if (err) {
                console.error('MySQL query error: ', err);
                return res.json({ message: "Server error" });
            }

            if (results.length === 0) {
                return res.json({ message: "Daily record not found for this user and date" });
            }


            const dailyRecord = results[0];
            return res.status(200).json(dailyRecord);
        });
    } catch (error) {
        console.error('Error fetching daily record: ', error);
        return res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;