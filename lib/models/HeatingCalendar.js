"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const heatingCalendarSchema = new Schema({
	date: Date,
	plan: {
		type: String,
		ref: 'HeatingPlan'
	}
});

heatingCalendarSchema.index({date: 1});
heatingCalendarSchema.set('versionKey', false);

module.exports = mongoose.model('HeatingCalendar', heatingCalendarSchema);
