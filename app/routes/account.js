"use strict";

var express = require('express');
var router = express.Router();
var chalk = require('chalk');
var bodyParser = require('body-parser');
var url = require('url');
var User = require('../models/user');

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
		//console.log(chalk.bgCyan('welcome'));
		res.send('hello account');
	});//end index
	
	router.put('/edit/',isLoggedIn,function (req,res){
		User.findByIdAndUpdate(req.body.owner, { $set: { private: req.body.data }}, { new: true }, function (err, user) {
		  if (err) {
		  	res.json({status:'eror',msg:'error'})
		  }else if(user){
		  	res.json({
		  		status:'ok',
		  		msg:user.private
		  	});
		  }
		  //res.send(tank);
		});
	});//end /person
     
    return router;
}//end exports

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.render('pages/index.ejs');
}