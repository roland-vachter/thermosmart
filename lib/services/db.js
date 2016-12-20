'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const autoIncrement = require('mongoose-auto-increment');

const options = {
	server: {
		socketOptions: {
			keepAlive: 120
		}
	}
};

mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.MONGO_URL, options);

autoIncrement.initialize(mongoose.connection);
