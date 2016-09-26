"use strict";

var express = require('express');
var router = express.Router();
var chalk = require('chalk');
var bodyParser = require('body-parser');
var url = require('url');
var Content = require('../models/content');
var User = require('../models/user');
var image_folder="uploads/bot/";
var qs = require('querystring');

router.use(bodyParser.json()); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
router.use(function timeLog(req, res, next) {

  next();
});


function getURL(req){
	var requrl = url.format({
	    protocol: req.protocol,
	    host: req.get('host'),
	    pathname: req.originalUrl,
	});

	return requrl;
}
//module.exports = router;
module.exports = function(passport) {
       // init your routes with passport and router
	router.get('/',function(req,res){
		console.log(chalk.bgCyan('welcome'));
		
		res.send('hello explore');
	});//end index
	
	router.get('/people/:userName',function (req,res){
		var image_host = getHost(req);
		console.log(chalk.bgGreen('img_host '+image_host));
		var search_name = (req.params.userName).replace(/\s/g, "") ;
			User.
			find({'username' : new RegExp(search_name, 'i')},null, {sort: {username: 1},limit:10},function (err,doc){
				if(err){
					res.json({msg:'Errr '+search_name});	
				}else if(doc.length){	
					var found_index =-1;
					for(var i=0;i<doc.length;i++){
						doc[i].profile_image =image_host+"/"+ image_folder+doc[i].profile_image;
						console.log(chalk.red(i,doc[i].profile_image));
					}
					//console.log(doc);
					var result = {
						msg:'success',
						type:'user',
						user:doc
					}
					res.json(result);
					
				}else if(doc.length==0){
					res.json({msg:'notfound',
						type:'user',
						user:search_name
					});
				}
			});
		//res.send(next_url);
	});//end /person

	router.get('/person/:userName',function(req,res){
		User
			.findOne({'username':req.params.userName})
			.exec(function (err,result){
				if(err){
					res.send('err:'+err);
				}
				//console.log(result);
				if(result==null){
					res.send('not found '+req.params.userName);
				}else if(result){
					if(result.private){
						res.send('sorry'+req.params.userName);

					}else{
						//res.send('hello '+req.params.userName);
						prepare_data_for_person(result,req,res);
						console.log('id '+result._id);
					}
				}
			});//end user.find
		
	});//end get person

	router.get('/user/recent',isLoggedIn,function(req,res){
		var limit_content = 15;
		Content
			.find({'owner':req.query.uid})
			.exec(function (err,result){
				console.log(chalk.green('get data '+result.length));
				var find_index = -1;
				for(var i=0;i<result.length;i++){
					if(result[i]._id ==req.query.max_id){
						find_index = i;
						break;
					}
				}
				var has_next_page = false;
				var host = getURL(req);
				var image_host = getHost(req);
				//console.log(chalk.cyan('host: '+host));
				if(result.length>0 && (find_index+1)<result.length){
					var start_cut = (find_index+1);
					var cut_end = (find_index+1)+limit_content;
					
					if(cut_end>result.length){
						cut_end = result.length;
					}
					result=result.splice(start_cut,cut_end);
					if(result.length>15){
						result.length=15;
						has_next_page=true;
					}else if(result.length<=15){
						console.log(chalk.bgYellow('this is last page'));
					}
					for(i=0;i<result.length;i++){
						result[i].filename=image_host+"/"+image_folder+result[i].filename;
					}
					//console.log('----------------');
					host = host.replace(req.query.max_id,result[result.length-1]._id);
					host =host.replace("%3F","?");
					res.json({
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
	});//end get recent
     
    return router;
}//end exports

function getURL(req){
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

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.render('pages/index.ejs');
}

function prepare_data_for_person(user,req,res){
	var me =user;
	//console.log(chalk.yellow(base_url));
	var host = getHost(req);
	console.log('host is '+host);
	//var host = "www.gogole.com";
	var my_all_post=0;
	console.log('-------------------------');
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
						//console.log('end aggregate')
						for(var i=0;i<result.length;i++){
								result[i].filename=host+"/"+image_folder+result[i].filename;
								console.log(chalk.green(i,result[i].filename));
						}
						
						var obj = {
							user:{
								_id:me._id,
								fullname:me.fullname,
								username:me.username,
								profile_picture:host+"/"+image_folder+me.profile_image,
								private:me.private
							},
							pagination:{
								has_next:true,
								next_url:host+"/explore/user/recent?uid="+me._id+"&max_id="+result[result.length-1]._id,
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

						//res.json(obj);
						console.log('final');
						 res.render('pages/me.ejs',{
						 	data:obj
						 });
					}//end else
				}//end function 

				);//end content.aggregate
		  }	//end else
		});//end where
}