"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const heatingCalendarSchema = new Schema({
	date: Date,
	plan: {
		type: Number,
		ref: 'HeatingPlan'
	}
});

heatingCalendarSchema.index({date: 1});
heatingCalendarSchema.set('versionKey', false);
heatingCalendarSchema.plugin(autoIncrement.plugin, 'HeatingCalendar');

module.exports = mongoose.model('HeatingCalendar', heatingCalendarSchema);
