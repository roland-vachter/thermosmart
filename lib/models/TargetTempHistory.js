"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const targetTempHistorySchema = new Schema({
	datetime: {
		type: Date,
		index: true
	},
	t: Number
});

targetTempHistorySchema.index({datetime: 1});
targetTempHistorySchema.set('versionKey', false);

module.exports = mongoose.model('TargetTempHistory', targetTempHistorySchema);
