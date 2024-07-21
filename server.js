const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({path: './config.env'});

const app = require('./app');


const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
//db.replace('<PASSWORD>', process.env.PASSWORD)
mongoose.connect(DB)
.then((con)=>{
    console.log('db connected successfully')
})
.catch((err)=>{
    console.log('error occured:');
})


const port = process.env.PORT || 3333;
// console.log(process.env);
app.listen(port, ()=>{
    console.log(`this server is running on port ${port}`);
});