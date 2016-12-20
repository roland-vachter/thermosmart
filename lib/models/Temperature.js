"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const temperatureSchema = new Schema({
	name: {
		type: String,
		index: true,
		unique: true
	},
	iconClass: String,
	color: String,
	value: Number
});

temperatureSchema.index({name: 1});
temperatureSchema.set('versionKey', false);
temperatureSchema.plugin(autoIncrement.plugin, 'Temperature');

module.exports = mongoose.model('Temperature', temperatureSchema);
