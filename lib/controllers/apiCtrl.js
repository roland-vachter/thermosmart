"use strict";

const outsideConditions = require('../services/outsideConditions');
const Temperature = require("../models/Temperature");

exports.init = function (req, res, next) {
	Temperature.find().exec().then((temps) => {
		res.json({
			outside: outsideConditions.get(),
			temperatures: temps
		});
	}).catch(next);
};
