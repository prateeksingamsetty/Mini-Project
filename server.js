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
let Admin = require('./models/admin');
let voteDetail = require('./models/voteDetails');
let catchAsync = require('./utils/catchAsync')
let candidateData = Candidate.find({});
const mongoose = require('mongoose');
const { resourceLimits } = require('worker_threads');
const flash = require('connect-flash');

const mc = require('mongodb').MongoClient;




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
    // Configure Sessions Middleware
app.use(session(sessionConfig))

app.use(express.urlencoded({ extended: true }));
app.use(flash());
var sessionFlash = function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();

}
app.use(sessionFlash)

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
    res.render('login', { data: { view: false, msg: "Username was not given" } })
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/secret', (req, res) => {
    res.render('secret')
})

//Login Post Route    
app.post('/login', (req, res) => {
    if (!req.body.username) {
        console.log("username nottaken");
        res.render('login', { data: { view: true, msg: "Username was not given" } })
    } else {
        if (!req.body.password) {
            console.log("password not taken");
            res.render('login', { data: { view: true, msg: "Password was not given" } })
        } else {
            console.log("Entered else");
            passport.authenticate('local', function(err, user) {
                console.log("Entered auth");
                if (err) {
                    console.log(err);

                    res.render('login', { data: { view: true, msg: err } });
                } else {
                    if (!user) {
                        console.log("usernotfound");
                        res.render('login', { data: { view: true, msg: "Username or password incorrect " } })
                    } else {
                        req.login(user, function(err) {
                            var casted = false;
                            if (err) {
                                console.log(err);
                                res.render('login', { data: { view: true, msg: err } });
                            } else {
                                candidateData.exec(function(error, data) {
                                        if (error) throw error;
                                        var casted;
                                        User.findOne({ username: req.user.username }).then(
                                            (result, err) => {
                                                if (err) throw err;

                                                casted = result.voted;
                                                console.log(casted);
                                                res.render('home', { message: "You've successfully registered", records: data, username: req.user.username, casted: casted });
                                            }
                                        ).catch(err => {
                                            console.log("error is" + err);
                                            res.status(500).json({
                                                error: err
                                            });
                                        });

                                    })
                                    // res.render('home', { message: "You've successfully registered", records: {}, username: req.user.username, casted: casted })
                            }
                        })
                    }
                }
            })(req, res);
        }
    }
})


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
        agenda: req.body.agenda
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

    var showOpt;
    // Admin.findOne({}, function(err, result) {
    //     if (err) console.log(err);
    //     else {
    //         console.log(result[1].startDate);
    //         if ((result[0].startDate - new Date()) < 0 && (result[0].endDate - new Date()) > 0) {
    //             showOpt = true;
    //         } else {
    //             showOpt = false;
    //         }
    //     }
    //     console.log(parseInt(result[0].startDate - new Date()));
    //     console.log((result[0].endDate - Date()));
    //     console.log(result[0].startDate);
    //     console.log((new Date()).getTime());
    //     console.log(result[0].endDate);
    //     console.log("showOpt" + showOpt);
    // })

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

    var numberOfUsers;
    User.find({}, function(err, response) {
        if (err) {
            console.log(err);
        } else {
            numberOfUsers = response.length;
        }
    })

    var numberOfVoters;
    voteDetail.find({}, function(err, result) {
        if (err) {
            console.log(err);
        } else {
            var array = {}
            numberOfVoters = result.length;
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
            var display;
            if (numberOfVoters == numberOfUsers) {
                display = true;
            } else {
                display = false;
            }
            var winner = ans[Math.floor(Math.random() * ans.length)];
            res.render('results', { winner: winner, display: display });
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
            res.render('statistics', { records: new_array, username: req.user.username });
        }
    });
})

app.get('/temppp', (req, res) => {
    // if (req.user.username == "18071A05G1")
    res.render('temppp')
        // res.send(401);
})

app.post('/temppp', (req, res) => {
    mc.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
        if (err) {
            console.log("err in db conn", err);
        } else {
            dbo = client.db("voting");
            dbo.collection('admins').insertOne({ startDate: req.body.startDate, endDate: req.body.endDate }, (err, res) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("inserted successfully" + res.message)
                }
            });
        }
    })
})


app.listen(port, function(req, res) {
    console.log('connected succesfully');
})