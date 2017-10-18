"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const authTokenSchema = new Schema({
	token: {
		type: String,
		index: true
	}
});

authTokenSchema.index({token: 1});
authTokenSchema.set('versionKey', false);

module.exports = mongoose.model('AuthToken', authTokenSchema);
