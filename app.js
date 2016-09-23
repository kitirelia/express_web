var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var chalk = require('chalk');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configSecret = require('./config/secret.js');
var configDB = require('./config/database.js');


mongoose.connect(configDB.url);
mongoose.connection.on('open', function (ref) {
	console.log(chalk.bgGreen('Connected to mongo server.'));
});
mongoose.connection.on('error', function (err) {
 	console.log(chalk.red('Error to mongo server.'));
 	console.log(err);
});


require('./config/passport')(passport);

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: configSecret.session_secret,resave: true, saveUninitialized: true })); // session secret
app.use(passport.initialize());
app.use(passport.session()); 
app.use(flash());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/public',express.static(__dirname + '/public'));
// routes ======================================================================
require('./app/routes_manager.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port,function (){
	console.log(chalk.green('server start...'+port));
});