"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const outsideConditionHistorySchema = new Schema({
	datetime: {
		type: Date,
		index: true
	},
	t: Number,
	h: Number
});

outsideConditionHistorySchema.index({datetime: 1});
outsideConditionHistorySchema.set('versionKey', false);

module.exports = mongoose.model('OutsideConditionHistory', outsideConditionHistorySchema);
