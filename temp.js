const { urlencoded } = require('body-parser');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcrypt');

var url = "mongodb+srv://prateek:prateek2606@freecluster.0qnz4.mongodb.net/test";

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("mongo conn open")
    })
    .catch(err => {
        console.log("mongoose conn error");
        console.log(err);
    })

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));


app.get('/secret', (req, res) => {
    res.send('This is secret')
})

//register get
app.get('/register', (req, res) => {
    res.render('register');
})

//register post
app.post('/register', async(req, res) => {
    const { password, username } = req.body;
    const hash = await bcrypt.hash(password, 12);
    res.send(hash);
})

//login get
app.get('/login', (req, res) => {
    res.render('login');
})

//login post
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
})

//listen
app.listen(3000, (req, res) => {
    console.log("server listen on port 3000");
})