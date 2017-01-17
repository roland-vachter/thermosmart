const HeatingDefaultPlan = require('../models/HeatingDefaultPlan');
const moment = require('moment-timezone');

module.exports = function () {
	return HeatingDefaultPlan.findOne({
			dayOfWeek: new Date().getDay()
		})
		.populate({
			path: 'plan',
			populate: {
				path: 'intervals.temp'
			}
		})
		.exec()
		.then(todaysPlan => {
			let targetTemp;

			const now = moment().tz("Europe/Bucharest");
			const nowHours = now.hours();
			const nowMinutes = now.minutes();

			todaysPlan.plan.intervals.forEach(interval => {
				if (nowHours > interval.startHour ||
						(nowHours === interval.startHour &&
						nowMinutes >= interval.startMinute)) {
					targetTemp = interval.temp;
				}
			});

			return targetTemp.value;
		});
};
