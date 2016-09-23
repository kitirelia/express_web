var mongoose = require('mongoose');
var chalk = require('chalk');

var Schema = mongoose.Schema;

var content_tag_schema= new Schema({
	content_id:{type: Schema.Types.ObjectId, ref: 'Content_data'},
	tag_id:{type: Schema.Types.ObjectId, ref: 'All_hashtag'},
	tag_name:{type: String, ref: 'All_hashtag'}
});

content_tag_schema.set('collection','Hashtag_content');
var ContentTag = mongoose.model('Hashtag_content',content_tag_schema);

module.exports = ContentTag;