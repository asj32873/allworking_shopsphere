const {z}=require('zod');
const registerSchema=z.object({name:z.string().min(2),email:z.string().email(),phone:z.string().optional(),password:z.string().min(6)});
const vendorRegisterSchema=z.object({ownerName:z.string().min(2),storeName:z.string().min(2),email:z.string().email(),phone:z.string().optional(),storeAddress:z.string().min(5),password:z.string().min(6)});
const loginSchema=z.object({email:z.string().email(),password:z.string().min(1)});
module.exports={registerSchema,vendorRegisterSchema,loginSchema};
