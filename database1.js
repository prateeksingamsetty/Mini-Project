const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs');
const app = express();
const User = require('./models/user');
const passport = require('passport');
const LocalStrategy = require('passport-local');
var dbUrl = "mongodb+srv://prateek:prateek2606@freecluster.0qnz4.mongodb.net/voting";

//passport
app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, function(error, script) {
    if (error) {
        console.log("error is ", err);
    } else {
        console.log("succesfully connected");
        //console.log(script)
    }
});



const myObj = {
    "RollNo": {
        "0": "18071A05G1",
        "1": "18071A05G2",
        "2": "18071A05G3",
        "3": "18071A05G4",
        "4": "18071A05G5",
        "5": "18071A05G6"
    },
    "CGPA": {
        "0": 8.02,
        "1": 9.65,
        "2": 6.78,
        "3": 10.0,
        "4": 6.23,
        "5": 7.0
    },
    "Backlogs": {
        "0": 1,
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 2,
        "5": 3
    },
    "Password": {
        "0": "vnrvjiet",
        "1": "vnrvjiet",
        "2": "vnrvjiet",
        "3": "vnrvjiet",
        "4": "vnrvjiet",
        "5": "vnrvjiet"
    }
};

var j = 0;
for (var i = 0; i < 6; i++) {
    var big = {};
    j = 0;
    for (var y in myObj) {
        if (j == 0) {
            big.RollNo = myObj[y][i];
        } else if (j == 1) {
            big.CGPA = myObj[y][i];
        } else if (j == 2) {
            big.Backlogs = myObj[y][i];
        } else if (j == 3) {
            big.Password = myObj[y][i];
        }
        j++;
    }

    //hashed password
    /*const hashedPassword = bcrypt.hashSync(big.Password, 10);

    User.create({
        username: big.RollNo,
        CGPA: big.CGPA,
        Backlogs: big.Backlogs,
        Password: hashedPassword
    }, function(error, result) {
        if (error) {
            console.log("failed inserting");
            console.log(error);
        }
    })*/
    User.register(new User({ username: big.RollNo, CGPA: big.CGPA, Backlogs: big.Backlogs, voted: false }), big.Password, function(err, user) {
        if (err) {
            console.log("error");
            console.log(err);
            //return res.sendFile(__dirname + '/public/register.html');
        }
        console.log(user);
        passport.authenticate("local")(req, res, function() {
            res.sendFile(__dirname + '/public/secret.html');
        })
    })
}