"use strict";

exports.setCache = (res, value) => {
	if (process.env.CACHE_ENABLED === 'true') {
		if (value > 0) {
			res.set('Cache-Control', 'public, max-age=' + value);
		} else {
			exports.setNoCache(res);
		}
	} else {
		exports.setNoCache(res);
	}
};

exports.setNoCache = (res) => {
	res.set('Cache-Control', 'private, no-cache, no-store');
};
