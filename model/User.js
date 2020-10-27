var mongoose = require('mongoose');

var connection = mongoose.createConnection('mongodb://msaifee:saiMoh95@ds047514.mlab.com:47514/exercisetrack');


var exerciseSchema = new mongoose.Schema({

    description: {
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        required:true
    }
});


var userSchema = new mongoose.Schema({
    username : {
    	type:String,
    	unique:true,
    	required:true
    },
    exercises:[exerciseSchema] 
});

mongoose.model("User", userSchema);