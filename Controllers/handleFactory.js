



// ! We are impleting factory function i.e , implementing a function which return a new controller(middleware) funciton , and we only need to pass the model as a argument , this function helps to reduce redundant code 



const deleteOne = Model => async(req,res)=>{

  try {
    console.log(req.params.id)
    const doc = await Model.findByIdAndDelete(req.params.id)
    if(!doc){
      return res.status(404).json({
        status:"fail",
        message:"Invalid id"
      })
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    return res.status(400).json({
      status:"fail",
      message:"Invalid data sent "
    });
  }

}

const updateOne = Model => async (req,res)=>{
  try {
    // const tour = await Tour.findByIdAndUpdate({_id:req.params.id},req.body,{new:true});
    // !or  is same as ,
    const doc = await Model.findOneAndUpdate({_id:req.params.id},req.body,{ 
      new:true,
      runValidators:true
    })  
     
    return res.status(200).json({
      status:"success",
      data:{
        doc
      }
    })
  } catch (error) {
    return res.status(400).json({
      status:"fail",
      message:"Invalid data sent "
    }) 
  }
}

const getOne = (Model,populateOption) => async (req,res)=>{
  try {
    let query ;
    query = Model.findById({_id:req.params.id});
    if(populateOption) query = Model.findById({_id:req.params.id}).populate(populateOption);
    const doc = await query;
    return res.status(200).json({
      status:"success",
      data:{
        doc
      }
    });
  } catch (error) {
      return res.status(400).json({
        status:"fail",
        message:"Invalid data sent "
      })
  } 
}

const createOne = Model => async (req,res)=>{
  try {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour : doc
      },
    });

  } catch (error) {
    return res.status(400).json({
      status:"fail",
      message:error
    });
  }
}

const getAll = Model => async (req,res)=>{
  
}




module.exports = {
  deleteOne , updateOne , getOne , createOne
}