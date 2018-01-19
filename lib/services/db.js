'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const options = {
	useMongoClient: true,
	keepAlive: true,
	connectTimeoutMS: 30000,
	socketTimeoutMS: 30000
};

mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI || process.env.MONGO_URL, options);
