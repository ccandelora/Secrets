//jshint esversion:6
require('dotenv').config({ path: '.env' })
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.set("view engine", "ejs")

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = process.env.SECRET;
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });
const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res){
    res.render("home");
});

app.route("/login")
    .get(function(req, res){
        res.render("login");
    })
    .post(function(req, res){
        User.findOne({email: req.body.username}).then((foundUser) => {
            if(foundUser){
                if(foundUser.password === req.body.password){
                    res.render("secrets");
                }else {
                    res.send("Incorrect password");
                }
            }else{
                res.send("User not found");
            }
        }).catch((err) => {
            console.log(err);
            res.send(err);
        });
    });

app.route("/register")
 .get(function(req, res){
    res.render("register");
})
.post(function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save().then(() => {
        res.render("secrets");
    })
    .catch((err) => {
        res.send(err);
    });
});


connectDB().then(() => {
    app.listen(PORT, function() {
      console.log("listening to requests");
    });
  }).catch((err) => { 
    res.send(err);
});