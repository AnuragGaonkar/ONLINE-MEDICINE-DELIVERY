import express from 'express'
import mongoose from 'mongoose';
import cors from 'cors'
import { userRouter } from './routes/user.js';
const app = express();

app.use(express.json())
app.use(cors())
app.use("/auth", userRouter)

app.get('/', (req, res) => {
    res.send("Hello World")
})

mongoose.connect("mongodb+srv://medicine:root@medicinedelivery.9x8uj.mongodb.net/")

app.listen(5000, () => {
    console.log("Server listening at port 5000")
})