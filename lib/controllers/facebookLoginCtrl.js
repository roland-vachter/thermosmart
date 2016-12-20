"use strict";

const passport = require('passport');

exports.auth = passport.authenticate('facebook', {
	scope: ['email']
});

exports.callback = passport.authenticate('facebook', {
	successRedirect : '/',
	failureRedirect : '/login/facebook/forbidden'
});

exports.forbidden = function (req, res) {
	res.sendStatus(403);
};

exports.checkStatus = function (req, res) {
	if (req.isAuthenticated()) {
		return res.sendStatus(200);
	}

	res.sendStatus(403);
};
