var mongoose = require('mongoose');
var chalk = require('chalk');

var Schema = mongoose.Schema;

var tagSchema = new Schema({
	name:String,
	createdAt: {
        type: Date,
        required: false,
        default: Date.now
     },
     founder:{type: Schema.Types.ObjectId, ref: 'User'}
	//create_date:{Date,timestamps: true} 
});
tagSchema.set('collection', 'All_hashtag');

tagSchema.methods.check_TagExist = function(cb){
	return this.model('All_hashtag').find({ name: this.name }, cb);
};

var Tags = mongoose.model('All_hashtag',tagSchema);
module.exports = Tags;