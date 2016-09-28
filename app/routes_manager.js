"use strict";

var chalk = require('chalk');
var User = require('./models/user');
var Content = require('./models/content');
var image_folder="uploads/bot/";
var url = require('url');

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
		//res.redirect('/explore/person/'+req.user.username);
		prepare_data_for_me(req,res);
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

function prepare_data_for_me(req,res){
	var me =req.user;
	var host = getURL(req);
	var my_all_post=0;
	Content
		.where('owner', me._id).count(function (err, count) {
		  if (err) return handleError(err);
		  else{
		  	my_all_post = count;
		  	
		  	Content
				.aggregate([
					{
					    $match: { 'owner': me._id }
					},
					{ "$limit": 15 }
				],function (err,result){
					if(err){
						res.json({msg:'err'});
					}else{
						for(var i=0;i<result.length;i++){
							result[i].filename=image_folder+result[i].filename;
						}
						var has_next_page =true;
						var next_page_url = host+"/explore/user/recent?uid="+me._id+"&max_id="+result[result.length-1]._id;
						///console.log(chalk.yellow('res '+result.length));
						if(result.length<15){
							has_next_page=false;
							next_page_url="none";
							//console.log(chalk.red('set '+has_next_page));
						}
						var obj = {
							user:{
								_id:me._id,
								fullname:me.fullname,
								username:me.username,
								profile_picture:image_folder+me.profile_image,
								private:me.private
							},
							pagination:{
								has_next:has_next_page,
								next_url:next_page_url,
								next_max_id:result[result.length-1]._id
							},
							meta:{
								code:200
							},
							stat:{
								post:my_all_post,
								following:0,
								follower:0
							},
							result
						}//end obj
						//console.log(chalk.bgRed(obj.pagination.has_next));
						//res.json(obj);
						res.render('pages/me.ejs',{
							data:obj
						});
					}//end else
				}//end function 

				);//end content.aggregate
		  }	//end else
		});//end where
}
function getURL(req){
	var requrl = url.format({
	    protocol: req.protocol,
	    host: req.get('host'),
	    //pathname: req.originalUrl,
	});

	return requrl;
}

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.render('pages/index.ejs');
}