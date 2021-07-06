let express = require('express');
let session = require('express-session');
let bcrypt = require('bcryptjs');
let path = require('path');
let app = express();
let passport = require('passport');
let multer = require('multer');
let LocalStrategy = require('passport-local')
let User = require('./models/user')
let Candidate = require('./models/candidate');
let catchAsync = require('./utils/catchAsync')
let candidateData = Candidate.find({});
const mongoose = require('mongoose');
const candidate = require('./models/candidate');



var urlencodedParser = express.urlencoded({ extended: false })
app.use(express.static(path.join(__dirname, './public')));

app.set('view engine', 'ejs');

let port = 3000;

let sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(express.urlencoded({ extended: true }));

// Configure Sessions Middleware
app.use(session(sessionConfig))

//passport
app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



let requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        return res.render('login')
    }
    next();
}

//mongoDB connection
dbUrl = "mongodb+srv://prateek:prateek2606@freecluster.0qnz4.mongodb.net/test";
mongoose.connect(dbUrl, { useNewUrlParser: true });

mongoose.connection.once('open', function() {
    console.log('connection has been made');
}).on('error', function(error) {
    console.log('error is ', error);
})

//Storage
let storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if (file.fieldname === 'image') {
            cb(null, './uploads/');
        } else {
            cb(null, './agendaUploads/');
        }
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
})

let upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.render('firstPage', { message: 'hi' });
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/secret', (req, res) => {
    res.render('secret')
})

//Login Post Route    
app.post('/login', passport.authenticate("local", {
    successRedirect: '/secret',
    failureRedirect: '/login',
}), function(req, res) {});


//Register Route
app.post('/register', urlencodedParser, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'agenda', maxCount: 1 }]), (req, res) => {
    console.log(req.body);
    console.log("file ", req.files);
    var userName = req.body.username;
    var Password = req.body.password;
    var candidate = new Candidate({
        username: req.body.username,
        partyname: req.body.partyname,
        image: req.files.image[0].filename,
        agenda: req.files.agenda[0].filename
    })
    var Cgpa;
    var Backlogs;

    var obj = { username: userName };

    /*dbo.collection('users').find(obj).toArray(function(err, result) {
        if (err) {
            console.log(err);
        } else if (result.length == 0) {
            console.log("user not found");
        } else if (result[0].CGPA < 7.0 || result[0].Backlogs > 0) {
            console.log("not eligible for registering");
        } else {
            req.session.user_id = result[0]._id;
            console.log(result);
        }
    })*/
    User.findOne(obj).then(function(result) {
        //console.log(res);
        Cgpa = result.CGPA;
        Backlogs = result.Backlogs;
        if (Cgpa < 7.0 || Backlogs > 0) {
            res.render('register', { message: "Sorry you're not eligible for registeration" });
        } else {
            candidate
                .save()
                .then(
                    (err, result) => {
                        if (err) throw err;

                        candidateData.exec(function(error, data) {
                            if (error) throw error;

                            console.log(result);
                            res.render('home', { message: "You've successfully registered", records: data });
                        })
                    })
                .catch(err => {
                    console.log(err);
                    res.status(500).json({
                        error: err
                    });
                });

        }
    })
})

//changePassword GET
app.get('/changePassword', (req, res) => {
    res.render('changePassword');
})

//changePassword POST
app.post('/changePassword', (req, res) => {
    User.findOne({ username: req.body.username }).then(function(sanitizedUser) {
        if (sanitizedUser) {
            sanitizedUser.setPassword(req.body.newpassword, function() {
                sanitizedUser.save();
                res.status(200).json({ message: 'password reset successful' });
            });
        } else {
            res.status(500).json({ message: 'This user does not exist' });
        }
    }, function(err) {
        console.error(err);
    })
})

//home page
app.get('/home', (req, res) => {
    candidateData.exec(function(error, data) {
        if (error) throw error;

        res.render('home', { message: "You've successfully registered", records: data });
    })
})

//secret page
app.get('/secret', requireLogin, (req, res) => {
    res.render('secret')
})

//logout 
app.post('/logout', (req, res) => {
    req.session.user_id = null;
    res.render('login')
})



app.listen(port, function(req, res) {
    console.log('connected succesfully');
})