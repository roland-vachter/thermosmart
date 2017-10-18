"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventEmitter = require('events');
const evts = new EventEmitter();

const heatingPlanSchema = new Schema({
	dayOfWeek: Number,
	plan: {
		type: String,
		ref: 'HeatingPlan'
	}
});

heatingPlanSchema.index({dayOfWeek: 1});
heatingPlanSchema.set('versionKey', false);

module.exports = mongoose.model('HeatingDefaultPlan', heatingPlanSchema);

module.exports.evts = evts;
module.exports.triggerChange = function (ids) {
	console.log('temp change triggered', ids);
	evts.emit('change', ids);
};
