let express = require('express');
let session = require('express-session');
let bcrypt = require('bcryptjs');
let path = require('path');
let app = express();
let passport = require('passport');
let multer = require('multer');
let LocalStrategy = require('passport-local')
let User = require('./models/user')
let Candidate = require('./models/candidates');
let voteDetail = require('./models/voteDetails');
let catchAsync = require('./utils/catchAsync')
let candidateData = Candidate.find({});
const mongoose = require('mongoose');
const { resourceLimits } = require('worker_threads');



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
dbUrl = "mongodb+srv://prateek:prateek2606@freecluster.0qnz4.mongodb.net/voting";
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
            cb(null, './public/uploads/');
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
    successRedirect: '/home',
    failureRedirect: '/login',
}), function(req, res) {});


//Register Route
app.post('/register', urlencodedParser, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'agenda', maxCount: 1 }]), (req, res) => {
    console.log(req.body);
    console.log("file ", req.files);
    var userName = req.body.username;
    var Password = req.body.password;

    var casted = false


    var candidate = new Candidate({
        username: req.body.username,
        partyname: req.body.partyname,
        image: req.files.image[0].filename,
        agenda: req.files.agenda[0].filename
    })
    var Cgpa;
    var Backlogs;

    var obj = { username: userName };

    User.findOne(obj).then(function(result) {
        Cgpa = result.CGPA;
        Backlogs = result.Backlogs;
        if (Cgpa < 7.0 || Backlogs > 0) {
            res.render('register', { message: "Sorry you're not eligible for registeration" });
        } else {
            candidate
                .save()
                .then(
                    (result, err) => {
                        if (err) throw err + "error1";

                        candidateData.exec(function(error, data) {
                            if (error) throw error + "error2";

                            console.log("result is" + result);
                            res.render('home', { message: "You've successfully registered", records: data, casted: casted });
                        })
                    })
                .catch(err => {
                    console.log("error is" + err);
                    res.status(500).json({
                        error: err
                    });
                });
        }
    })
})

//changePassword GET
app.get('/changePassword', isLoggedIn, (req, res) => {
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
app.get('/home', isLoggedIn, (req, res) => {
    candidateData.exec(function(error, data) {
        if (error) throw error;
        var casted;
        User.findOne({ username: req.user.username }).then(
            (result, err) => {
                if (err) throw err;

                casted = result.voted;
                console.log(casted);
                //console.log(data);
                res.render('home', { message: "You've successfully registered", records: data, username: req.user.username, casted: casted });
            }
        ).catch(err => {
            console.log("error is" + err);
            res.status(500).json({
                error: err
            });
        });

    })
})

//secret page
app.get('/secret', isLoggedIn, (req, res) => {
    res.render('secret')
})

//logout GET
app.get('/logout', (req, res) => {
    //req.session.user_id = null;
    req.logout();
    res.redirect('/')
})


//isLoggedIn function
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

//agendas page
app.get('/agendas', (req, res) => {
    candidateData.exec(function(error, data) {
        if (error) throw error;

        User.findOne({ username: req.user.username }).then(
            (result, err) => {
                if (err) throw err;

                res.render('agendas', { message: "You've successfully registered", records: data, username: req.user.username });
            }
        ).catch(err => {
            console.log("error is" + err);
            res.status(500).json({
                error: err
            });
        });

    })
})

//Voting page
app.post('/voteInc', isLoggedIn, (req, res) => {

    var vote = new voteDetail({
        username: req.user.username,
        partyname: req.body.candName,
    })

    vote.save()
        .then(
            (result, err) => {
                if (err) throw err + "error1";
                console.log("result is" + result);
            })
        .catch(err => {
            console.log("error is" + err);
            res.status(500).json({
                error: err
            });
        });

    User.findOneAndUpdate({ username: req.user.username }, { $set: { voted: true } }, (err, result) => {
        if (err) res.send(err + "error1");
        console.log("result is" + result.voted);
        res.render('voted', { message: "You've successfully voted", partyname: req.body.candName });
    })
})

//results page
app.get('/results', (req, res) => {

    voteDetail.find({}, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            var array = {}
            for (var i = 0; i < result.length; i++) {
                if (result[i].partyname in array) {
                    array[result[i].partyname] += 1
                } else {
                    array[result[i].partyname] = 1
                }
            }
            var maxi = -1;
            for (var key in array) {
                maxi = Math.max(maxi, array[key]);
            }
            var ans = [];
            for (const key in array) {
                if (array[key] === maxi) {
                    ans.push(key);
                }
            }
            var winner = ans[Math.floor(Math.random() * ans.length)];
            res.render('results', { winner: winner })
        }
    });
})

//Statistics Page
app.get('/statistics', (req, res) => {
    voteDetail.find({}, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            //console.log(result);
            var array = {}
            for (var i = 0; i < result.length; i++) {
                if (result[i].partyname in array) {
                    array[result[i].partyname] += 1
                } else {
                    array[result[i].partyname] = 1
                }
            }
            console.log(array);

            console.log(result);
            var temp = []
            temp.push(array);
            //console.log(temp);
            var new_array = [];
            var i = 0;
            for (var key in array) {
                var obj = {}
                obj['partyname'] = key;
                obj['votes'] = array[key];
                new_array[i++] = obj
            }
            console.log(new_array);
            res.render('statistics', { records: new_array });
        }
    });
})


app.listen(port, function(req, res) {
    console.log('connected succesfully');
})