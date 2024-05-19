const mysql = require('mysql');


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER, // MySQL kullanıcı adı
    password: process.env.DB_PASSWORD, // MySQL şifre
    database: process.env.DB_DATABASE // Veritabanı adı
})

db.connect((err) => {
    if(err) {
        console.error('MySQL Connection Error: ', err);
        throw err;
    }
    console.log('MySQL Connected!');
})

module.exports = db;