//jshint esversion:6
require('dotenv').config({ path: '.env' })
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
//const bcrypt = require("bcrypt");
//const saltRounds = 10;

const app = express();
const PORT = process.env.PORT || 3000;
app.set("view engine", "ejs")

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

//const secret = process.env.SECRET;
//userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("home");
});

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        } else {
            res.redirect("/");
        }
    });    
});


app.route("/login")
    .get(function(req, res){
        res.render("login");
    })
    .post(function(req, res){
       User.authenticate()(req.body.username, req.body.password, function(err, user) {
            if(err) {
                console.log(err);
                res.redirect("/login");
            } else if (user === false) {
                console.log("User not found");
                res.redirect("/login");
            } else {
                req.login(user, function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        res.redirect("/secrets");
                    }
                });
            }
        });
        /*
        User.findOne({email: req.body.username}).then((foundUser) => {
            if(foundUser){
               bcrypt.compare(req.body.password, foundUser.password).then(function(result) {
                    if(result === true) {
                        res.render("secrets");
                    } else {
                    res.send("Password not found");
                    }
                });
            } else {
                res.send("User not found");
            }
        });
        */
    });

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.route("/register")
 .get(function(req, res){
    res.render("register");
})
.post(function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

    /*
    bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
        const newUser = new User({
            email: req.body.username,
            //password: md5(req.body.password)
            password: hash
        });

        newUser.save().then(() => {
            res.render("secrets");
        }).catch((err) => {
            res.send(err);
        });
    });
    */   
});


connectDB().then(() => {
    app.listen(PORT, function() {
      console.log("listening to requests");
    });
  }).catch((err) => { 
    res.send(err);
});