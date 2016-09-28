"use strict";

var express = require('express');
var router = express.Router();
var chalk = require('chalk');
var bodyParser = require('body-parser');
var url = require('url');
var Content = require('../models/content');
var User = require('../models/user');
var Tag = require('../models/tags');
var Content_Tag = require('../models/content_tag');
var image_folder="uploads/bot/";
var qs = require('querystring');
var num_limit =15;

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
	
	router.get('/tags/recent',function(req,res){
		console.log(chalk.bgYellow('tag and  recent '+req.query.max_id,"and tag "+req.query.tag));
		Content_Tag.find({tag_name:req.query.tag}, function (err,result) {
			if(err){
				res.json('err'+err);
			}else if(result){
				console.log(chalk.green('done '+result.length));
				var id_arr = [];
				for(var i=0;i<result.length;i++){
		   			id_arr.push(result[i].content_id);
		   			//console.log(i,id_arr[i]); 
		   		}
		   		Content
			    .find({'_id':{$in:id_arr}})
			    .sort({'createdAt':-1})
			    .populate(
			    	{
			    		path:'owner'
			    	}
			    )
			    .exec(function(err, doc) {
			    	if(err){
			    		res.json({msg:'err'});
			    	}else if(doc){
			    		//console.log("------>"+doc.length);
			    		var find_index = -1;
			    		for(var i=0;i<doc.length;i++){
			    			//console.log(chalk.bgCyan(doc[i]));
							if(doc[i]._id==req.query.max_id){
								find_index=i;
								//console.log(chalk.cyan(i,doc[i].content_id));
								
								break;
							}
						}//end for
						if(doc.length>0 && (find_index+1)<result.length){
							var start_cut = (find_index+1);
							var cut_end = (find_index+1)+num_limit;
							var has_next_page = false;
							var host = getURL(req);
							var image_host = getHost(req);
							if(cut_end>doc.length){
								cut_end = doc.length;
							}
							doc=doc.splice(start_cut,cut_end);
							if(doc.length>num_limit){
								doc.length=num_limit;
								has_next_page=true;
							}else if(doc.length<=num_limit){
								console.log(chalk.bgYellow('this is last page'));
							}
							for(i=0;i<doc.length;i++){
								doc[i].filename=image_host+"/"+image_folder+doc[i].filename;
								//console.log(chalk.red(i));
							}
							host = host.replace(req.query.max_id,doc[doc.length-1]._id);
							host =host.replace("%3F","?");
							//console.log(chalk.bgCyan('host ')+host);
							var obj ={
							 	pagination:{
							 			has_next:has_next_page,
								 		next_url:host,
								 		next_max_id:200
							 	},
							 	tag_data:{
							 		hashtag_name:req.query.tag,
							 		all_post:10
							 	},
							 	data:doc
							 }//end var obj ={
							 res.json({
							 	pagination:{
							 			has_next:has_next_page,
								 		next_url:host,
								 		next_max_id:200
							 	},
							 	tag_data:{
							 		hashtag_name:req.query.tag,
							 		
							 	},
							 	result:doc
							 });
						}//end if doc.length>0 && (
					else{//last page
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
			    	}//end else if
			    }// end exec
			    );//end Content.find
			}// end else if(result)
		});//end Content_tag.find
	//	res.json('hello');
	});

	router.get('/tags/:tagName',function (req,res){
		//console.log(chalk.bgRed('location ')+req.headers.host);
		 
		Content_Tag.find({tag_name:req.params.tagName}, function (err,result) {
			if(err) {
				res.json({res:'Error'+err,
					data:[]
				});
			}else if(result){
				var id_arr = [];
				for(var i=0;i<result.length;i++){
		   			id_arr.push(result[i].content_id); 
		   		}
		   		var all_tag_post = result.length;
				Content
			    .find({'_id':{$in:id_arr}})
			    //.skip(max_id*num_limit)
			    .limit(num_limit)
			    .sort({'createdAt':-1})
			    .populate(
			    	{
			    		path:'owner'
			    	}
			    )
			    .exec(function(err, doc) {
			      if (err){
			      	console.log(chalk.red('Error'+err));
			      	res.json({res:'Error'+err,
						data:[]
					});
			      }
			      if (doc){
			      //	console.log(chalk.bgCyan('get all '+doc.length));
			      	var has_next_page =false;
			      	if(all_tag_post>num_limit){
			      		has_next_page=true;
			      		//doc.length=num_limit;
			      	}else if(all_tag_post<=num_limit){
			      		has_next_page=false;
			      	}
			      	var _max_id="";
			      	if(doc.length>1){
			      		_max_id = doc[doc.length-1]._id;
			      		console.log(chalk.bgRed('_max '+_max_id));
			      	}
			      	var host = getHost(req);
			      	host = host+"/explore/tags/recent?tag="+req.params.tagName+"&max_id="+_max_id;
					//console.log('host '+host);
			      	for(var i=0;i<doc.length;i++){
			      		doc[i].filename=getHost(req)+"/"+image_folder+doc[i].filename;
			      		//console.log(chalk.cyan(i));
			      	}///end for
						var obj ={
						 	pagination:{
						 			has_next:has_next_page,
							 		next_url:host,
							 		next_max_id:200
						 	},
						 	tag_data:{
						 		hashtag_name:req.params.tagName,
						 		all_post:all_tag_post
						 	},
						 	data:doc
						 }
						  res.render('pages/view_tag',{
						 		data:obj
						 });
			      	}	
			    });//end Content.find({'_id':{$in:id_arr}})
			}
		});
	});// end get /tags

	router.get('/nav_tags/:tagName',function (req,res){
		var search_tag = (req.params.tagName).trim();
		console.log('get nav '+search_tag);
		//res.send('nav'+search_tag);

		Content_Tag
		.aggregate([
	    { 
	    	$match: {  
	    		tag_name: { $regex: new RegExp(search_tag, 'i') } 
	    	} 
	    }, 
	    { 
	  		$group: { 
	         _id: '$tag_name'
	       , post: { $sum: 1 } 
	      }
	   },
	   { 
		   	$sort: {
		   		post:-1 
		   	}
	   },
	   {
	   		$limit:10
	   }
	], function(err, doc) {
	  		if(err){
				console.log(chalk.red('error nav tag'));
			}else{
				if(doc.length){
					for(var i=0;i<doc.length;i++){
					//console.log(chalk.green('found :'+doc[i]._id,doc[i].post));
					}
					var result = {
						msg:'success',
						type:'tags',
						user:doc
					}
					res.json(result);
				}else{
					console.log(chalk.bgGreen('NOT FOUND'));
					res.json({msg:'notfound',
						type:'tags',
						user:search_tag
					});
				}
				
			}
		//console.log(chalk.bgCyan('-------------------'));
	});


	});//end get nav_tagds

	router.get('/people/:userName',function (req,res){
		var image_host = getHost(req);
		//console.log(chalk.bgGreen('img_host '+image_host));
		var search_name = (req.params.userName).replace(/\s/g, "") ;
			User.
			find({'username' : new RegExp(search_name, 'i')},null, {sort: {username: 1},limit:10},function (err,doc){
				if(err){
					res.json({msg:'Errr '+search_name});	
				}else if(doc.length){	
					var found_index =-1;
					for(var i=0;i<doc.length;i++){
						doc[i].profile_image =image_host+"/"+ image_folder+doc[i].profile_image;
					//	console.log(chalk.red(i,doc[i].profile_image));
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
						//console.log('id '+result._id);
					}
				}
			});//end user.find
		
	});//end get person

	router.get('/user/recent',isLoggedIn,function(req,res){
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
	console.log(chalk.red('---------------------------------------'));
		
	
	if(req.isAuthenticated()){
		return next();
	}else if(!req.isAuthenticated()){
		if (req.xhr || req.headers.accept.indexOf('json') > -1) {
		 console.log(chalk.bgCyan('AJAX'));
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
		} else {
			console.log(chalk.bgGreen('web req'));
			res.render('pages/index.ejs');
		  // send your normal response here
		}
	}
	//res.render('pages/index.ejs');
}

function prepare_data_for_person(user,req,res){
	var me =user;
	//console.log(chalk.yellow(base_url));
	var host = getHost(req);
	console.log('host is '+host);
	//var host = "www.gogole.com";
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
						 res.render('pages/me.ejs',{
						 	data:obj
						 });
					}//end else
				}//end function 

				);//end content.aggregate
		  }	//end else
		});//end where
}

function hili_tag(str,url){
			var html_str="";
			var found=false;
			var buffering =false;
			var buffer_text="";
			var found_index=0;
			var flag_arr=['#','@'];
			var prefix="";
			var path ="";
						
			for(var i=0;i<str.length;i++){
				if(flag_arr.indexOf(str.charAt(i))>=0){
					prefix=flag_arr[flag_arr.indexOf(str.charAt(i))];
					if(prefix==="#"){
						path =url;
						//console.log('path here '+path);
					}else if(prefix!="#"){
						path ="http://www.instagram.com/";
					}
					if(!buffering){	
						buffering=true;
						buffer_text="";
						found_index=i;
					}else if(buffering){
						html_str+='<a href="'+path+(buffer_text.toLowerCase().trim())+'/">'+prefix+buffer_text+'</a>';
						buffer_text="";
						found_index=i;
					}
				}
				if(buffering){
					if((isEmo(str.charAt(i)) || isPunctuation(str.charAt(i)) || str.charAt(i)==" " || i>=str.length-1) && i>found_index ){
						//console.log('case to end '+str.charAt(i),i);
						var end_str="";
						if(!(i>=str.length-1)|| !(isPunctuation(str.charAt(i))) ){
							buffer_text+=str.charAt(i);
						}
						html_str+='<a href="'+path+(buffer_text.toLowerCase().trim())+'/">'+prefix+buffer_text+'</a>'+end_str;
						buffer_text="";
						buffering=false;
					}else{
						if(str.charAt(i)!=="#" && str.charAt(i)!=="@")buffer_text+=str.charAt(i);
					}
				}
				else if(!buffering){
					html_str+=str.charAt(i);
				}
			}
			//console.log(html_str);
			return html_str;
}//end hilitag
function readable_time(UNIX_timestamp) {
			var now =new Date();
			var then = new Date(UNIX_timestamp);
			var time="wait";
			var duration = moment.duration(moment(now).diff(then));
			
			var d_year = duration.years();
			var d_month = duration.months();
			var d_week = duration.weeks();
			var d_day = duration.days();
			var d_hrs = duration.hours();
			var d_min =duration.minutes();
			var d_sec = duration.seconds();
			if(d_year>0){
				time = d_year+"y";
			}else if(d_month>0){
				time = d_month+"mo";
			}
			else if(d_week>0){
				time =d_week+"w";
			}else if(d_day>0){
				time = d_day+"d";
			}else if(d_hrs>0){
				time = d_hrs+"h";
			}else if(d_min>0){
				time = d_min+"m";
			}else if(d_sec>0){
				time= d_sec+"s";
			}

			time = time;
			 return time;
}//end translate_time


function isPunctuation(str){
				//return /[.,\/#!$%\^&\*;:{}=\-_`~()]/g.test(str);
				return /[.,\/#!$%\^&\*;:{}=\-`~()]/g.test(str);//exclude _ underscore
			}//end isPunctuation
			function isEmo(s) {
			    return /[^\u0000-\u00ff]/.test(s);
			}//end isEmo
			
			function clean_emoji(string){
				return string.replace(regexAstralSymbols, '');
			}//end  clean_emoji
			function countSymbols(string) {
				return string
					// Replace every surrogate pair with a BMP symbol.
					.replace(regexAstralSymbols, '_')
					// …and *then* get the length.
					.length;
			}//end count symbol