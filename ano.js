const mongoose = require('mongoose');

//connect with DB
mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });

mongoose.connection.once('open', function() {
    console.log('connection has been made');
}).on('error', function(error) {
    console.log('error is ', error);
})


var myObj, x;
myObj = {
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

var log = console.log.bind(console);

/*var arr = [];
var j = 0;
for (var i = 0; i < 6; i++) {
    var big = {};
    var a, b, c, d;
    j = 0;
    for (var y in myObj) {
        var obj;
        if (j == 0) {
            obj = { RollNo: myObj[y][i] }
                //a = { RollNo: obj };
            a = { RollNo: myObj[y][i] };
        } else if (j == 1) {
            obj = { CGPA: myObj[y][i] }
                //b = { CGPA: obj };
            b = { CGPA: myObj[y][i] };
        } else if (j == 2) {
            obj = { Backlogs: myObj[y][i] }
                //c = { Backlogs: obj };
            c = { Backlogs: myObj[y][i] };
        } else if (j == 3) {
            obj = { Password: myObj[y][i] }
                //d = { Password: obj };
            d = { Password: myObj[y][i] };
        }
        console.log("obj ", obj);
        //var obj = { nor: myObj[y][i] }
        //big = { y: obj };
        j++;
        console.log("y ", y)
        console.log(myObj[y][i]);

    }
    var small = []
    small.push(a)
    small.push(b)
    small.push(c)
    small.push(d)

    arr.push(small)
}
var newObj = arr.reduce((a, b, c, d) => Object.assign(a, b, c, d), {})

console.log(arr.length)
console.log("newObj ", newObj)
console.log(arr);*/

var arr = [];
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
    arr.push(big);
}
console.log(arr);