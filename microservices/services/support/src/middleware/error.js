function notFound(req,res){res.status(404).json({success:false,message:`Route not found: ${req.method} ${req.originalUrl}`});}
function errorHandler(err,req,res,next){
 console.error(err);
 if(err.name==='ValidationError') return res.status(400).json({success:false,message:'Validation error.',details:Object.values(err.errors).map(e=>e.message)});
 if(err.code===11000) return res.status(409).json({success:false,message:'A record with a unique field already exists.',details:err.keyValue});
 if(err.name==='CastError') return res.status(400).json({success:false,message:'Invalid resource ID.'});
 res.status(err.status||500).json({success:false,message:err.status?err.message:'Internal server error.'});
}
module.exports={notFound,errorHandler};
