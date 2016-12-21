const HeatingDefaultPlan = require('../models/HeatingDefaultPlan');

let isOn = false;
const sensorData = {
	temp: 19.7
};

exports.setSensorData = (data) => {
	sensorData = data;
};



function updateHeatingStatus () {
	HeatingDefaultPlan.findOne({
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
		if (todaysPlan) {
			let targetTemp;

			const today = new Date();

			todaysPlan.plan.intervals.forEach(interval => {
				if (today.getHours() >= interval.startHour &&
						today.getMinutes() >= interval.startMinute) {
					targetTemp = interval.temp;
				}
			});

			if (!isOn && sensorData.temp <= targetTemp.value - 0.2) {
				isOn = true;
				console.log('heating turned on');
			} else if (isOn && sensorData.temp >= targetTemp.value + 0.2) {
				isOn = false;
				console.log('heating turned off');
			}
		}
	}).catch((err) => {
		console.log("Error occured while fetching the heating plan for today", err);
	});
}

updateHeatingStatus();
setInterval(updateHeatingStatus, 10 * 1000);
