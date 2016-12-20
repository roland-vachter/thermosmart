"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const authTokenSchema = new Schema({
	token: {
		type: String,
		index: true,
		unique: true
	}
});

authTokenSchema.index({token: 1});
authTokenSchema.set('versionKey', false);
authTokenSchema.plugin(autoIncrement.plugin, 'AuthToken');

module.exports = mongoose.model('AuthToken', authTokenSchema);
