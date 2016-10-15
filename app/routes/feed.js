var express = require('express');
var router = express.Router();
var chalk = require('chalk');
var bodyParser = require('body-parser');
var Content = require('../models/content');
var url = require('url');
var moment = require('moment');
var image_folder="uploads/bot/";

router.use(bodyParser.json()); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
router.use(function timeLog(req, res, next) {

  next();
});

module.exports = function( passport) {
	router.get('/',isLoggedIn,function(req,res){
		console.log(chalk.green("session is "+req.session.passport['user']));
		Content
			.find({})
			.populate('owner')
			.limit(15)
			.sort({'createdAt':-1})
			.exec(function (err,result){
				console.log('get res '+result.length);
				
				if(err){
					res.json({msg:err});
				}// end if err
				if(result){
					var feed_link=getHost(req)+'/feed';
					for(var i=0;i<result.length;i++){
			      		result[i].filename=getHost(req)+"/"+image_folder+result[i].filename;
			      		result[i].owner.profile_image = getHost(req)+"/"+image_folder+result[i].owner.profile_image
			      		result[i].caption = hili_tag(result[i].caption,getHost(req)+"/explore/tags/");
			      		result[i].time = readable_time(result[i].createdAt);
			      		console.log(chalk.bgRed(result[i].time));
			      	}///end for
			      	
			      	//result[i].createdAt=readable_time(result[i].createdAt);
			      	console.log(chalk.bgGreen(result[0]));
			      	//console.log(chalk.bgCyan(result[0].owner.profile_image));
			      	var obj ={
							nav_bar:{
								feed_url:feed_link
							},
						 	pagination:{
						 			has_next:false,
							 		next_url:'www.google.com',
							 		next_max_id:200
						 	},
						 	data:result
						 }//end obj
					res.render('pages/view_feed.ejs',{data:obj});
				}//end if result
			}//end exec
			);//end Content.find
			
			
		
		//res.render('pages/signup.ejs', { message: req.flash('signupMessage') });
	});//end index
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