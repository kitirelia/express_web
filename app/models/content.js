
var mongoose = require('mongoose');
var chalk = require('chalk');

var Schema = mongoose.Schema;
var contentSchema = new Schema({
	caption:String,
	filename:String,
	owner:{type: Schema.Types.ObjectId, ref: 'User'},
	createdAt: {
        type: Date,
        required: false,
        default: Date.now
     },
  tag_arr:{type:[],select:false},
  other_user:[]
});
contentSchema.set('collection', 'content_data');

contentSchema.methods.check_TagExist = function(cb){
	return 'hey';
  //return this.model('user_data').find({ username: this.username }, cb);
};

contentSchema.methods.getFeed = function(cb){
	//query.find({ name: 'Los Pollos Hermanos' }).find(callback);
  return this.model('content_data').find({}, cb)
  			//.limit(15)
  			.sort({createdAt: 1})
  			.limit(15)
  			;
};



var Content = mongoose.model('Content_data',contentSchema);
module.exports = Content;
