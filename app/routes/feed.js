var express = require('express');
var router = express.Router();
var chalk = require('chalk');
var bodyParser = require('body-parser');
var Content = require('../models/content');
var url = require('url');
var moment = require('moment');
var image_folder="uploads/bot/";
var num_limit=10;
router.use(bodyParser.json()); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
router.use(function timeLog(req, res, next) {

  next();
});

module.exports = function( passport) {
	//router.get('/',function(req,res){
	router.get('/',isLoggedIn,function(req,res){
		//console.log(chalk.green("session is "+req.session.passport['user']));
		Content
			.find({})
			.populate('owner')
			.limit(num_limit)
			.sort({'createdAt':-1})
			.exec(function (err,result){
				console.log('get res '+result.length);
				
				if(err){
					res.json({msg:err});
				}// end if err
				if(result){
					//console.log('before '+result.length);
					//result.length=15;
					var feed_link=getHost(req)+'/me';
					for(var i=0;i<result.length;i++){
			      		result[i].filename=getHost(req)+"/"+image_folder+result[i].filename;
			      		result[i].owner.username="<a href='"+getHost(req)+"/explore/person/"+result[i].owner.username+"' class='feed_name_detail feed_dec_username'>"+result[i].owner.username+"</a>" 
			      		result[i].owner.profile_image = getHost(req)+"/"+image_folder+result[i].owner.profile_image
			      		result[i].caption = hili_tag(result[i].caption,getHost(req)+"/explore/tags/");
			      		result[i].time = readable_time(result[i].createdAt);
			      		//console.log(chalk.bgRed(result[i].time));
			      	}///end for
			      	
					var _max_id="";
			      	if(result.length>1){
			      		_max_id = result[result.length-1]._id;
			      		console.log(chalk.bgRed('_max '+_max_id));
			      	}
			      	var host = getURL(req);
			      //	host = host.replace(req.query.max_id,result[result.length-1]._id);
					host =host+"/recent?uid="+req.session.passport['user']+"&max_id="+_max_id;
					//console.log(chalk.bgCyan('session '+req.session.passport['user']));
			      	var obj ={
			      			user:{
			      				_id:req.session.passport['user'],
			      				username:'extend'
			      			},
							nav_bar:{
								feed_url:feed_link,
								show_login:false,
								left_nav_to:"Me",
							},
						 	pagination:{
						 			has_next:true,
							 		next_url:host,
							 		next_max_id:_max_id
						 	},
						 	data:result
						 }//end obj
					res.render('pages/view_feed.ejs',{data:obj});
				}//end if result
			}//end exec
			);//end Content.find
	});//end index

	router.get('/recent',isLoggedIn,function(req,res){
	//router.get('/recent',function(req,res){
		// console.log(req.query.uid);
		// console.log(req.query.max_id);

		Content
			.find({})
			.populate('owner')
			.sort({'createdAt':-1})
			.exec(function (err,result){
				var has_next_page = false;
				if(err){
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
				}if(result){
					var find_index = -1;
					for(var i=0;i<result.length;i++){
						if(result[i]._id ==req.query.max_id){
							find_index = i;
							break;
						}
					}
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
							//console.log(chalk.bgYellow('this is last page'));
						}
						var host = getURL(req);
						host = host.replace(req.query.max_id,result[result.length-1]._id);
						host =host.replace("%3F","?");
						var image_host = getHost(req);
						var new_data = [];
						for(i=0;i<result.length;i++){
							var obj = new Object();

							obj={
								filename:(image_host+"/"+image_folder+result[i].filename),
								owner:{
									_id:result[i].owner._id,
									private:result[i].owner.private,
									username:"<a href='"+getHost(req)+"/explore/person/"+result[i].owner.username+"' class='feed_name_detail feed_dec_username'>"+result[i].owner.username+"</a>" ,
									//username:result[i].owner.username,
									fullname:result[i].owner.fullname,
									profile_image: getHost(req)+"/"+image_folder+result[i].owner.profile_image
								},
								caption:hili_tag(result[i].caption,getHost(req)+"/explore/tags/"),
								time:readable_time(result[i].createdAt)
							}
							new_data.push(obj);
						}
						
						res.json({
							pagination:{
									has_next:has_next_page,
									next_url:host,
									next_max_id:result[result.length-1]._id
							},
							meta:{
								code:200
							},
							data:new_data
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
					}//end last page
					//console.log(chalk.green('find index '+find_index));
				}
				//console.log(chalk.bgGreen('done '+result.length));
			});//end exec

	});//end get recent
	return router;
}//end exports

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.render('pages/index.ejs');
}
function getHost(req){
	var requrl = url.format({
	    protocol: req.protocol,
	    host: req.get('host'),
	    //pathname: req.originalUrl,
	});
	return requrl;
}
function getURL(req){
	var requrl = url.format({
	    protocol: req.protocol,
	    host: req.get('host'),
	    pathname: req.originalUrl,
	});
	return requrl;
}

function readable_time(UNIX_timestamp) {
			var now =new Date();
			var then = moment(UNIX_timestamp, "MM-DD-YYYY");
			//console.log('then--> '+then);
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