try{
    console.log(req.query);
    //BUILD QUERY
    //1, FILTERING
    const queryObj = {...req.query};
    const excludeFields = ['limit', 'sort', 'fields', 'page'];
    excludeFields.forEach(el => {
        delete queryObj.el;
    })
    
    //2, ADVANCED FILTERING
      let queryStr = JSON.stringify(queryObj);
     //find({difficulty: 'easy', duration: {$gte: 5}});
     //find({difficulty: 'easy', duration: {gte: '5'}});
      queryStr = querStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
      console.log(JSON.parse(queryStr));
      let query = Tour.find(JSON.parse(queryStr));

      //3, SORTING
      if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        console.log(sortBy);
        query.sort(sortBy);
      }else {
        query.sort('-createdAt');
      }

      //4, PAGINATION
      const page = req.query.page || 1;
      const limit = req.query.limit || 100;
      const skip = (page-1)*limit;
      if(req.query.page){
        const tourNums = await Tour.countDocuments(); //RETURNS THE NUMBER OF DOCUMENTS IN A DB
        if(skip >= tourNums){
            throw new Error('This page does not exist');
        }
      }

      //EXECUTE QUERY
    const tours = await query;
   
   
    res.status(200).json({
        status: 'success',
        result: tours.length,
        data: {
            tours: tours
        }
    })
  }

    catch(err){
    res.status(404).json({
        status: 'fail',
        data:'fail to fetch the data'
    })
  }
    

  const sumOfTwo = x => {
    return (y) => {
      return x+y;
    }
  }

  const AddThree = sumOfTwo(4);
  const result = AddThree(5);

  console.log(result);