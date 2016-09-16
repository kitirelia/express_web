var LocalStrategy = require('passport-local').Strategy;

var  User = require('../app/models/user');
var chalk=require('chalk');

module.exports = function(passport){
	passport.serializeUser(function(user,done){
		done(null,user.id);
	});

	passport.deserializeUser(function (id,done){
		User.findById(id,function (err,user){
			done(err,user);
		});
	});

	passport.use('local-signup',new LocalStrategy({
		usernameField:'email',
		passwordField:'password',
		passReqToCallback:true
	},
	function (req,email,password,done){
		process.nextTick(function(){
			User.findOne({'email':email},function(err,user){
				if(err) {
					return done(err);
				}//end if(err)
				if(user){
					return done(null,false,req.flash('signupMessage', 'That email is already taken.'));
				}//end if user
				else{
					var newUser  = new User();
					newUser.email=email;
					newUser.password = newUser.generateHash(password);

					newUser.save(function(err) {
	                    if (err)
	                        throw err;
	                    return done(null, newUser);
	                });
				}
			});
		});
	}
	));//end passport.use('local-signup'
	//--------------------------------------
	passport.use('local-kiti-login',new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        User.findOne({ 'email' :  email }, function(err, user) {
            if (err){
                return done(err);
            }
            if (!user){
            	console.log(chalk.yellow('No user found'));
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            }
            if (!user.validPassword(password)){
            	console.log(chalk.bgYellow('Oops! Wrong password'));
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
            }

            // all is well, return successful user
            console.log(chalk.cyan(user));
            return done(null, user);
        });

    }));
	
}//end module.exports