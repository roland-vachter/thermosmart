"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const heatingPlanSchema = new Schema({
	name: {
		type: String,
		index: true,
		unique: true
	},
	intervals: [{
		startHour: Number,
		startMinute: Number,
		temp: {
			type: Number,
			ref: 'Temperature'
		}
	}],
	iconClass: String
});

heatingPlanSchema.index({name: 1});
heatingPlanSchema.set('versionKey', false);
heatingPlanSchema.plugin(autoIncrement.plugin, 'HeatingPlan');

module.exports = mongoose.model('HeatingPlan', heatingPlanSchema);
