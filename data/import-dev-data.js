const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../model/tourModel');
const mongoose = require('mongoose');
dotenv.config({path: './config.env'});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
//db.replace('<PASSWORD>', process.env.PASSWORD)
mongoose.connect(DB)
.then((con)=>{
    console.log('db connected successfully');
})
.catch((err)=>{
    console.log('error occured:', err);
})

//console.log(process.argv);

const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/tours-new.json`, 'utf-8'));

const importData = async () => {
    try{
        await Tour.create(tours, {validateBeforeSave: false});
    }catch(err){
        console.log(err);
    }
}

const deleteData = async () => {
    try{
      await Tour.deleteMany();
      console.log('data deleted successfully');
    }catch(err){
        console.log(err);
    }
}

if (process.argv[2] === '--import'){
    importData();
}else if(process.argv[2] === '--delete'){
    deleteData();
}
//process.exit();

