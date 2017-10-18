"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	email: {
		type: String,
		index: true
	}
});

userSchema.index({email: 1});
userSchema.set('versionKey', false);

module.exports = mongoose.model('User', userSchema);
