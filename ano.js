let Admin = require('./models/admin');

//mongoDB connection
dbUrl = "mongodb+srv://prateek:prateek2606@freecluster.0qnz4.mongodb.net/voting";
mongoose.connect(dbUrl, { useNewUrlParser: true });

mongoose.connection.once('open', function() {
    console.log('connection has been made');
}).on('error', function(error) {
    console.log('error is ', error);
})