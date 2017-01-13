"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const heatingStatisticsSchema = new Schema({
	date: {
		type: Date,
		index: true,
		unique: true
	},
	avgTargetTemp: Number,
	avgOutsideTemp: Number,
	runningMinutes: Number
});

heatingStatisticsSchema.index({date: 1});
heatingStatisticsSchema.set('versionKey', false);
heatingStatisticsSchema.plugin(autoIncrement.plugin, 'HeatingStatistics');

module.exports = mongoose.model('HeatingStatistics', heatingStatisticsSchema);
