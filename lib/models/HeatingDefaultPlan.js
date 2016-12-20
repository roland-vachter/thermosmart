"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const heatingPlanSchema = new Schema({
	dayOfWeek: Number,
	plan: {
		type: Number,
		ref: 'HeatingPlan'
	}
});

heatingPlanSchema.index({dayOfWeek: 1});
heatingPlanSchema.set('versionKey', false);
heatingPlanSchema.plugin(autoIncrement.plugin, 'HeatingDefaultPlan');

module.exports = mongoose.model('HeatingDefaultPlan', heatingPlanSchema);
