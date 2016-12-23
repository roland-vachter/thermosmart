const apiKey = process.env.API_KEY;

module.exports = function (req, res, next) {
	if (req.query.apiKey === apiKey ||
			req.body.apiKey === apiKey ||
			req.headers['X-API-KEY'] === apiKey) {
		next();
	} else {
		const err = new Error('Forbidden');
		err.status = 403;
		next(err);
	}
};
