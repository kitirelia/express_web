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
		successRedirect:'/feed',
		//successRedirect:'/me',
		failureRedirect:'/login',
		failureFlash:true
	})

	);//end app.post login
	app.get('/me',isLoggedIn,function(req,res){
		//console.log(chalk.bgRed('session is '+req.session));
		prepare_data_for_me(req,res);
	});

	app.get('/me/recent',isLoggedIn_Json,function(req,res){
		if(req.session.passport['user']==req.query.uid){
			prepare_me_json(req.query.uid,req.query.max_id,req,res);
		}else{
			console.log('spam');
			res.status(403).send({ 
		        success: false, 
		        message: 'No token provided.' 
		    });
		}
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

function prepare_me_json(uid,last_id,req,res){
	//console.log('here for me ');
	Content
			.find({'owner':uid})
			.sort({'createdAt':-1})
			.exec(function (err,result){
				//console.log(chalk.green('get data '+result.length));
				var find_index = -1;
				for(var i=0;i<result.length;i++){
					if(result[i]._id ==last_id){
						find_index = i;
						break;
					}
				}
				//console.log('end for');
				var has_next_page = false;
				var host = getOrigin(req);
				//console.log(chalk.bgYellow("first "+host));
				var image_host = getHost(req);
				var num_limit = 15;
				
				if(result.length>0 && (find_index+1)<result.length){
					var start_cut = (find_index+1);
					var cut_end = (find_index+1)+num_limit;
					
					if(cut_end>result.length){
						cut_end = result.length;
					}
					result=result.splice(start_cut,cut_end);
					if(result.length>num_limit){
						result.length=num_limit;
						has_next_page=true;
					}else if(result.length<=num_limit){
						console.log(chalk.bgYellow('this is last page'));
					}
					for(i=0;i<result.length;i++){
						result[i].filename=image_host+"/"+image_folder+result[i].filename;
					}
					//console.log('----------------');
					//console.log(chalk.cyan('host: '+host),has_next);
					host = host.replace(req.query.max_id,result[result.length-1]._id);
					host =host.replace("%3F","?");
					//console.log(chalk.yellow('now host')+host);
					var feed_link=getHost(req)+'/feed';
					res.json({
						nav_bar:{
							feed_url:feed_link
						},
						pagination:{
								has_next:has_next_page,
								next_url:host,
								next_max_id:result[result.length-1]._id
						},
						meta:{
							code:200
						},
						result
					});
				}else{//last page
					res.json({
						pagination:{
								has_next:false,
								next_url:"",
								next_max_id:""
						},
						meta:{
							code:403
						},
						result:""
					});
				}
			});//end content.find
	//res.send('hello');
}//end func prepare_json_me

function prepare_data_for_me(req,res){
	var me =req.user;
	var host = getOrigin(req);
	var my_all_post=0;
	var feed_link=getHost(req)+'/feed';
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
					{ 
						$sort : { createdAt : -1 } 
					},
					{ 
						"$limit": 15 
					}
				],function (err,result){
					if(err){
						res.json({msg:'err'});
					}else{
						for(var i=0;i<result.length;i++){
							result[i].filename=image_folder+result[i].filename;
						}
						var has_next_page =true;
						var next_page_url = host+"/recent?uid="+me._id+"&max_id="+result[result.length-1]._id;
						if(result.length<15){
							has_next_page=false;
							next_page_url="none";
						}
						var obj = {
							nav_bar:{
								feed_url:feed_link,
								show_login:false,
								left_nav_to:"Feed",
							},
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
function getOrigin(req){
	var requrl = url.format({
	    protocol: req.protocol,
	    host: req.get('host'),
	    pathname: req.originalUrl,
	});

	return requrl;
}
function getHost(req){
	var requrl = url.format({
	    protocol: req.protocol,
	    host: req.get('host'),
	    //pathname: req.originalUrl,
	});
	return requrl;
}

function isLoggedIn_Json(req,res,next){
	//console.log(chalk.bgRed('-----------req '+getOrigin(req)),req.isAuthenticated());
	if(req.isAuthenticated()){
		return next();
	}else{
		console.log(chalk.bgCyan('force redirect'));
	}
	res.status(403).send({ 
		        success: false, 
		        message: 'No token provided.' 
	});
	//console.log(chalk.bgYellow('-------- done render page'));
}

function isLoggedIn(req,res,next){
	//console.log(chalk.bgRed('-----------req '+getOrigin(req)),req.isAuthenticated());
	if(req.isAuthenticated()){
		return next();
	}
	res.render('pages/index.ejs');
}