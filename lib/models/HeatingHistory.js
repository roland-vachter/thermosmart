"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const heatingHistorySchema = new Schema({
	datetime: {
		type: Date,
		index: true
	},
	status: Boolean
});

heatingHistorySchema.index({datetime: 1});
heatingHistorySchema.set('versionKey', false);
heatingHistorySchema.plugin(autoIncrement.plugin, 'HeatingHistory');

module.exports = mongoose.model('HeatingHistory', heatingHistorySchema);
