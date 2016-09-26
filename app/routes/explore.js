"use strict";

var express = require('express');
var router = express.Router();
var chalk = require('chalk');
var bodyParser = require('body-parser');
var url = require('url');
var Content = require('../models/content');
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
	
	router.get('/person2/:userName',function (req,res){
		var base_url = getURL(req);
		var check_index=base_url.indexOf(req.params.userName);
		var other_tag_path = base_url.substring(0,(check_index));
		base_url=base_url.substring(0,(check_index+req.params.userName.length))+"/";
  		var next_url=base_url;
		console.log('this url '+next_url);
		res.send(next_url);
	});//end /person

	router.get('/person/recent',isLoggedIn,function(req,res){
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
				console.log(chalk.cyan('host: '+host));
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
						result[i].filename=image_folder+result[i].filename;
					}
					console.log('----------------');
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

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.render('pages/index.ejs');
}