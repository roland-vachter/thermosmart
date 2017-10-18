"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const heatingStatisticsSchema = new Schema({
	date: {
		type: Date,
		index: true
	},
	avgTargetTemp: Number,
	avgOutsideTemp: Number,
	avgOutsideHumi: Number,
	runningMinutes: Number
});

heatingStatisticsSchema.index({date: 1});
heatingStatisticsSchema.set('versionKey', false);

module.exports = mongoose.model('HeatingStatistics', heatingStatisticsSchema);
