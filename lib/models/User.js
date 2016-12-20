"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');

const userSchema = new Schema({
	email: {
		type: String,
		index: true,
		unique: true
	}
});

userSchema.index({email: 1});
userSchema.set('versionKey', false);
userSchema.plugin(autoIncrement.plugin, 'User');

module.exports = mongoose.model('User', userSchema);
