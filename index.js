const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config()
const authRouter = require('./routes/authRoutes');
const foodRouter = require('./routes/foodRoutes');
const userRouter = require('./routes/userRoutes');

app.use(bodyParser.json());


app.use('/api/auth', authRouter);
app.use('/api/food', foodRouter);
app.use('/api/user', userRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})