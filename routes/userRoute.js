const router=require('express').Router()
const {check,validationResult}=require('express-validator')
const User=require('../models/Users')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const Authentication=require('../middleware/authenticate')





  router.get('/',Authentication, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password')
      res.json(user)
    } catch (err) {
      console.error(err.message)
      res.status(500).send('Server Error')
    }
  })



//@route post /user/register
//@desc Register user
//@access Public
router.post('/register',
//chech data
[
    check('name','Name is require')
    .not()
    .isEmpty(),

    check('email','please include valid email')
    .isEmail(),

    check('password',
    'please enter a password with 6 or more characters'
    ).isLength({min:6})
],

(req,res)=>{
  const errors=validationResult(req);
        if(!errors.isEmpty()){
          return res.status(400).json({
            errors:errors.array()
          });
  }

  const{name,email,password}=req.body;

  User.findOne({ email })
  .then(user => {
      if (user) {
        res.status(400).json({ msg: "User already exists" }); 
      };

       //password bcrypt

      bcrypt.hash(password, 11, (err, hash) => {
          if (err) {
              return  res.status(400).send('Server Error ');
          }

          let user = new User({
              name,
              email,
              password: hash,
             
          })
      

          user.save()
              .then(user => {
                  res.status(201).json({
                      msg: 'User Created Successfully',
                  })
              })
              .catch(err=>{
                 res.status(400).send('server Error');
             })
      })
  })
  .catch(err=>{
             res.status(400).send('server Error');
         })
}

);



//@route post api/user/login
//@desc Authentication & get token
//@access Public
router.post('/login',

[

    check('email','please include valid email').isEmail(),

    check('password','password is requerd').exists()
],

(req,res)=>{
  const errors=validationResult(req);
        if(!errors.isEmpty()){
          return res.status(400).json({
            errors:errors.array()
          });
  }
  const{email,password}=req.body;

  User.findOne({email})
          //use populate for transaction
          .then(user=>{
          
            if(!user){
              return res.status(400).json({msg:"user not found"})
            }

            bcrypt.compare(password,user.password,(err,result)=>{
               if(err){
                 res.status(500).json({
                   msg:"server error"
                 })
               }

               if(!result){
                 return      res.status(400).json({
                   msg:"password doesnot match"
                 })
               }
        //create token
              let token =jwt.sign({
                _id: user._id,
                name: user.name,
                email: user.email,
                
              },'SECRET',{expiresIn:'24h'})

               res.status(200).json({
                 msg:"login succesfull",
                 token:`Bearer ${token}`
               })

            })
          })
          .catch(error=>{
            res.status(500).json({massage:"server error ",error})
          })
        }

);




     

module.exports=router