var express = require('express');
const { check, validationResult } = require('express-validator');
var mongoose = require('mongoose');
var router = express.Router();

var Users = mongoose.model('User');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('signup',{errors:false,form_errors:false});
});

router.post('/new-user', [check('userid','User ID is required').notEmpty()] ,function(req, res, next) {

	const errors = validationResult(req);

	if(!errors.isEmpty()){
		res.render('signup',{errors:errors.array()});
	}
	else{

		console.log(req.body.userid);
		var userid = req.body.userid;
		Users.findOne({username:req.body.userid},function(err,resp){

			if(resp){

				var errors = [{"msg":"Username already in use"}];
				res.render('signup',{errors:errors,form_errors:false});

			}
			else{

				var newUser = new Users();
				newUser.username = userid;
				newUser.save(function(err,resp){

					if(err)
						console.log(err);
					else{
						console.log(resp);
						res.send(resp);
					}	
				});
			}
		});
	}
});

router.get('/users', function(req, res, next) {

	Users.find({},'_id username', function(err,resp){

		if(err)
			console.log(err);

		res.send(resp);
	});
});

router.post('/add',
	[

	 check('userid','User ID is required').trim().notEmpty(),
	 check('description','description is required').trim().notEmpty(),
	 check('duration','duration is required').trim().notEmpty(),

	], function(req, res, next) {

		console.log(req.body);

		var form_errors = validationResult(req).array();
		var date = req.body.date;

		if(date === '')
			var d = Date.now();		
		else{

			if(!isValidDate(date))
				form_errors.push({"msg":"Invalid Date"});
			else
				var d = new Date(date);
		}

		console.log(d);
		console.log(form_errors);
		console.log(form_errors.length);

		if(form_errors.length > 0){
			res.render('signup',{errors:false,form_errors:form_errors});
		}
		else{

			Users.findOne({_id:req.body.userid},function(err,resp){

				if(err)
					res.send("User Id not found");
				else{
					
					var exercise = {description:req.body.description,duration:req.body.duration,date:d};
					resp.exercises.push(exercise);

					Users.updateOne({_id:req.body.userid},{exercises:resp.exercises},function(err,data){

						if(err)
							console.log(err);

						res.send(resp);

					});
				}

			});
		}
});

router.get('/log/:userid/:from?/:to?/:limit?', function(req, res, next) {

	console.log(req.params);

	var query = [];

	query.push({$match:{_id:mongoose.Types.ObjectId(req.params.userid)}});
	// query.push({$unwind:'$exercises'});
	
	if(req.params.from !== undefined){	

		var from = new Date(req.params.from);
		var to = new Date(req.params.to);
		console.log(from);
		console.log(to);

		// query.push({$match:{date:{$gte:from,$lte:to}}});
		query.push({$project: {exercises: { $filter: { input: "$exercises", as: "exercise", cond: { $and: [
        { $gte: [ "$$exercise.date", from ] },
        { $lte: [ "$$exercise.date", to ] }
      	] }}}}});
	}

	query.push({$unwind:'$exercises'});

	// query.push({$count: "total_exercises"});

	if(req.params.limit !== undefined){
		query.push({$limit:parseInt(req.params.limit)});
	}

	// query.push({$group :{_id : "$exercises" ,total:{$sum:1}}});
	// query.push({$project:{log:'$_id',"total":1}});

	console.log(query);
	Users.aggregate(query).exec(function(err,resp){

		if(err)
			console.log(err);
		// console.log(resp);
		resp.push({"total":resp.length});

		res.send(resp);

	});
	// res.send("Hoi");
});


function isValidDate(dateString)
{
    // First check for the pattern
    if(!/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(dateString))
        return false;

    // Parse the date parts to integers
    var parts = dateString.split("-");
    var day = parseInt(parts[2], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[0], 10);

    // Check the ranges of month and year
    if(year < 1000 || year > 3000 || month == 0 || month > 12)
        return false;

    var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
};


module.exports = router;
