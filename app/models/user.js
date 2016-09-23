var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
	fullname: { type:String,trim:true},
	username: { type: String, required: [true,'no username'], trim:true,unique: true },
   	email: { 
	    type: String, 
	    required: [true,'blank email'],
	    unique: true,
	    trim:true,
	    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
	    select: false //protect when fetch data
	},
    password: { type: String, trim:true,required:[true,'no password'], select: false ,min: [3,'password too short']},
    profile_image:String,
    staff_level:Number,
    created_at: {
        type: Date,
        required: false,
        default: Date.now,
        select:false
    },
  	updated_at: Date,
    token:{type:String,select:false},
    private:Boolean
});


// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    console.log('validPassword password');
    return bcrypt.compareSync(password, this.password);
};
userSchema.methods.checkExist = function(cb){
  return this.model('User').find({ username: this.username }, cb);
  //var username = this.username;
  //return 'May '+username;
};
// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);