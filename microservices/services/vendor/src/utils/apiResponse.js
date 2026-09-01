function ok(res,data,message='OK',status=200){return res.status(status).json({success:true,message,data});}
function fail(res,message,status=400,details){return res.status(status).json({success:false,message,...(details?{details}:{})});}
module.exports={ok,fail};
