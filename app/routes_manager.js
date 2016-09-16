module.exports = function(app,passport){
	
	app.get('/',function(req,res){
		
		res.render('pages/index.ejs');
	});

	app.get('/login',function (req,res){
		res.render('pages/login.ejs',{message:req.flash('loginMessage')});
	});
	app.post('/login',passport.authenticate('local-kiti-login',{
		successRedirect:'/me',
		failureRedirect:'/login',
		failureFlash:true
	})

	);//end app.post login

	app.get('/me',isLoggedIn,function(req,res){
		res.render('pages/me.ejs',{
			user:req.user
		});
	});

	app.get('/logout',function(req,res){
		req.logout();
		res.redirect('/');
	});

	app.get('/signup', function(req, res) {
        res.render('pages/signup.ejs', { message: req.flash('signupMessage') });
    });

	app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/me', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
};

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.render('/');
}