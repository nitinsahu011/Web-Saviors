const express = require('express');
const app = express();
const path = require( 'path' );
const cookieParser = require('cookie-parser');
const userModel = require("./models/user"); 
// const postModel = require( "./models/post" ) ;
const bcrypt = require( "bcrypt" ) ;
const jwt = require( "jsonwebtoken" ) ;
const user = require('./models/user');
// const post = require('./models/post');

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(cookieParser())

app.get('/', isLoggedIn, async (req,res) => {
    try {
        if (req.user) {
            // If user is logged in, retrieve user info
            const user = await userModel.findOne({ email: req.user.email });
            res.render('index', { user: user });
        } else {
            // If user is not logged in, render index page without user info
            res.render('index');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

app.get('/profile', (req, res)=>{
    res.render("profile", {user:user});
    // console.log(user)
})
app.get('/menu', (req, res)=>{
    res.render("menu", {user:user});
    // console.log(user)
})

app.get("/cart",(req,res) => {
    res.render("cart")
})



// app.get('/auth/google', (req, res) => {
//     // Redirect to Google OAuth 2.0 authorization endpoint
//     res.redirect('https://accounts.google.com/o/oauth2/v2/auth'
//         + '?client_id=YOUR_CLIENT_ID'
//         + '&redirect_uri=YOUR_REDIRECT_URI'
//         + '&response_type=code'
//         + '&scope=email'); // Specify the scope to request access to user's email
// });


app.get('/signup', (req,res) => {
    res.render("signup")
})

app.post('/signup',async (req,res) => {
    let {email,password,phoneNo,name} = req.body;
    
    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("User already exists.");

    bcrypt.genSalt(10, (err,salt) =>{
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                name,
                email,
                phoneNo,
                password:hash
            });

            let token = jwt.sign({email: email, userid:user._id}, "shhhh");
            res.cookie("token", token);
            res.render("index", {user:user});
        })
    })

})

app.get('/login', (req, res)=>{
    res.render("login");
})

app.post('/login',async (req,res) => {
    let {email,password} = req.body;
    
    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("something went wrong");

    bcrypt.compare(password, user.password, (err,result) => {
        if(result){
            let token = jwt.sign({email: email, userid:user._id}, "shhhh");
            res.cookie("token", token);
            res.status(200).render("index", {user:user});
        } 
        else res.redirect("/login");
    })    

}) 

app.get( '/logout',(req,res)=>{
    res.cookie("token", "");
    res.redirect("/login")
})


function isLoggedIn (req, res, next){
    if(req.cookies.token === "") res.render("login");
    else{
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
        next();
    }
}

app.listen(3001);