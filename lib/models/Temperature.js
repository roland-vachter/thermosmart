"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventEmitter = require('events');
const evts = new EventEmitter();

const temperatureSchema = new Schema({
	_id: Number,
	name: {
		type: String,
		index: true
	},
	iconClass: String,
	color: String,
	value: Number
});

temperatureSchema.index({name: 1});
temperatureSchema.set('versionKey', false);

module.exports = mongoose.model('Temperature', temperatureSchema);

module.exports.evts = evts;
module.exports.triggerChange = function (ids) {
	console.log('temp change triggered', ids);
	evts.emit('change', ids);
};
