var LocalStrategy = require('passport-local').Strategy;

var  User = require('../app/models/user');
var chalk=require('chalk');
var image_folder="uploads/";

function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
    	var randomPoz = Math.floor(Math.random() * charSet.length);
    	randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}

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
		user_fullnameField:'fullname',
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
					if(password.trim().length<3){
						return done(null,false,req.flash('signupMessage', 'password too short!.'));
					}else{
						var newUser  = new User();
						newUser.email=email;
						newUser.password = newUser.generateHash(password);
						newUser.fullname="fullname_"+randomString(7);
						newUser.username="username_"+randomString(7);
						newUser.profile_image="/def/profile.jpg";
						newUser.staff_level=5;
						newUser.token="token here";
						newUser.private=false;
						newUser.save(function(err,saved) {
		                    if (err){
		                    	console.log(chalk.bgRed(err));
		                    	var err_name="";
		                    	var error_msg="Something Wrong!";
		                    	for (field in err.errors) {
		                    		err_name = field;
								   	console.log(chalk.red("err:"+field ));
								    break;
								  }
								  if(err_name!="")error_msg = err.errors[err_name].message;
		             			//console.log(chalk.bgYellow(err.errors[err_name]));
		                        return done(null,false,req.flash('signupMessage',error_msg));
		                    }
		                    if(saved){
		                    	console.log(chalk.green(saved));
		                    	return done(null, newUser);
		                    }
		                    
		                });
					}//end else pass too short
					
				}//end else user
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
         User.findOne({'email' :  email}).select('password').exec(function (err, user) {
        //User.findOne({ 'email' :  email }, function(err, user) {
            if (err){
            	console.log(chalk.red('error '+err));
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