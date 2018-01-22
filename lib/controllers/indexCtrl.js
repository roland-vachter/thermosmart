"use strict";

const outsideConditions = require('../services/outsideConditions');

module.exports = function (req, res) {
	res.render('index', {
		title: "SmartHome",
		backgroundImage: outsideConditions.get().backgroundImage
	});
};
