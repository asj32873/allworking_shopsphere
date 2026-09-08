const router = require("express").Router();

const controller = require("../controllers/auth.controller");

const { validate } = require("@shopsphere/common");

const { authenticate } = require("../middleware/auth");

const { internal } = require("@shopsphere/common");

const {
  registerSchema,
  vendorRegisterSchema,
  loginSchema,
  auth0LoginSchema,
} = require("../validators/auth");

/* -------------------------------------------------------
   PUBLIC AUTH ROUTES
------------------------------------------------------- */

router.post(
  "/api/auth/register",
  validate(registerSchema),
  controller.register,
);

router.post(
  "/api/auth/vendor/register",
  validate(vendorRegisterSchema),
  controller.registerVendor,
);

router.post("/api/auth/login", validate(loginSchema), controller.login);
router.post(
  "/api/auth/auth0/login",

  validate(auth0LoginSchema),

  controller.auth0Login,
);
/* -------------------------------------------------------
   AUTHENTICATED USER ROUTES
------------------------------------------------------- */

router.get("/api/auth/me", authenticate, controller.me);

router.post("/api/auth/logout", authenticate, (req, res) => {
  return res.json({
    success: true,
    message: "Logged out.",
  });
});

/* -------------------------------------------------------
   INTERNAL SERVICE ROUTES

   These use x-internal-service-token rather than
   normal user JWT authentication.
------------------------------------------------------- */

router.get("/internal/users/:id", internal, controller.internalUser);

router.get("/internal/admin/users", internal, controller.internalUsers);

router.patch("/internal/users/:id", internal, controller.updateInternal);

module.exports = router;

// const router=require('express').Router();const c=require('../controllers/auth.controller');const validate=require('@shopsphere/common');const {authenticate}=require('../middleware/auth');const internal=require('@shopsphere/common');const {registerSchema,vendorRegisterSchema,loginSchema}=require('../validators/auth');
// router.post('/api/auth/register',validate(registerSchema),c.register);router.post('/api/auth/vendor/register',validate(vendorRegisterSchema),c.registerVendor);router.post('/api/auth/login',validate(loginSchema),c.login);router.get('/api/auth/me',authenticate,c.me);router.post('/api/auth/logout',authenticate,(req,res)=>res.json({success:true,message:'Logged out.'}));
// router.get('/internal/users/:id',internal,c.internalUser);router.get('/internal/admin/users',internal,c.internalUsers);router.get('/internal/admin/users',internal,c.internalUsers);router.patch('/internal/users/:id',internal,c.updateInternal);module.exports=router;
