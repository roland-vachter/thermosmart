"use strict";

//const AuthToken = require('../models/AuthToken');
//const generateRandomString = require('../utils/generateRandomString');

function login (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/login/facebook');
}

/*function login (req, res, next) {
	if (req.isAuthenticated()) {
		if (!req.cookies.auth_token) {
			const authToken = new AuthToken({
				token: generateRandomString()
			});

			authToken.save().then(() => {
				next();
			}).catch(() => {
				next();
			});
		}
	}

	if (req.cookies.auth_token) {
		AuthToken.findOne({
			token: req.cookies.auth_token
		}).then(entry => {
			if (entry) {
				next();
			} else {
				res.redirect('/login/facebook');
			}
		}).catch((err) => {
			console.log("Error fetching auth token.", err);
			res.redirect('/login/facebook');
		});
	} else {
		res.redirect('/login/facebook');
	}
}*/

module.exports = login;
