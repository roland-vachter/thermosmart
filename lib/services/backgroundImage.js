const arrayShuffle = require('../utils/arrayShuffle');

const images = {
	'autumn_clear1.jpg': {
		seasons: ['autumn'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'autumn_clear2.jpg': {
		seasons: ['autumn'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'not_winter_cloudy1.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['cloudy'],
		daytime: ['day']
	},
	'not_winter_night_clear1.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['clear'],
		daytime: ['night']
	},
	'not_winter_night_clear2.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['clear'],
		daytime: ['night']
	},
	'not_winter_night_clear3.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['clear'],
		daytime: ['night']
	},
	'fog.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['fog'],
		daytime: ['day', 'night']
	},
	'not_winter_night_rain1.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['rain'],
		daytime: ['night']
	},
	'not_winter_raining1.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['rain'],
		daytime: ['day']
	},
	'not_winter_raining2.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['rain'],
		daytime: ['day']
	},
	'not_winter_raining3.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['rain'],
		daytime: ['day']
	},
	'not_winter_sunset1.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['clear'],
		daytime: ['night']
	},
	'not_winter_sunset2.jpg': {
		seasons: ['spring', 'summer', 'autumn'],
		conditions: ['clear'],
		daytime: ['night']
	},
	'spring_clear1.jpg': {
		seasons: ['spring'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'spring_clear2.jpg': {
		seasons: ['spring'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'spring_clear3.jpg': {
		seasons: ['spring'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'summer_sunny1.jpg': {
		seasons: ['summer'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'summer_sunny2.jpg': {
		seasons: ['summer'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'summer_sunny3.jpg': {
		seasons: ['summer'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'summer_sunny4.jpg': {
		seasons: ['summer'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'winter_daylight.jpg': {
		seasons: ['winter'],
		conditions: ['cloudy', 'fog'],
		daytime: ['day']
	},
	'winter_daylight_snowing1.jpg': {
		seasons: ['winter'],
		conditions: ['snow'],
		daytime: ['day']
	},
	'winter_daylight_snowing2.jpg': {
		seasons: ['winter'],
		conditions: ['snow', 'clear'],
		daytime: ['day']
	},
	'winter_daylight_snowing3.jpg': {
		seasons: ['winter'],
		conditions: ['snow'],
		daytime: ['day']
	},
	'winter_night1.jpg': {
		seasons: ['winter'],
		conditions: ['all'],
		daytime: ['night']
	},
	'winter_sunny.jpg': {
		seasons: ['winter'],
		conditions: ['clear'],
		daytime: ['day']
	},
	'winter_clear.jpg': {
		seasons: ['winter'],
		conditions: ['clear', 'cloudy'],
		daytime: ['day']
	}
};

function getSeason () {
	const today = new Date();
	switch (today.getMonth()) {
		case 11:
		case 0:
		case 1:
			return 'winter';
		case 2:
		case 3:
		case 4:
			return 'spring';
		case 5:
		case 6:
		case 7:
			return 'summer';
		case 8:
		case 9:
		case 10:
			return 'autumn';
	}
}

const conditionMapping = {
	clear: 'clear',
	cloudy: 'cloudy',
	flurries: 'rain',
	fog: 'fog',
	hazy: 'fog',
	mostlycloudy: 'cloudy',
	mostlysunny: 'clear',
	partlycloudy: 'cloudy',
	partlysunny: 'sunny',
	sleet: 'rain',
	rain: 'rain',
	snow: 'snow',
	sunny: 'clear',
	tstorms: 'rain',
};

function getCondition (wunderCondition) {
	const condition = wunderCondition.replace('nt_', '');
	return conditionMapping[condition];
}

function getDaytime (wunderCondition) {
	if (wunderCondition.startsWith('nt_')) {
		return 'night';
	} else {
		return 'day';
	}
}


exports.get = wunderCondition => {
	const season = getSeason();
	const condition = getCondition(wunderCondition);
	const daytime = getDaytime(wunderCondition);

	let foundImages = [];
	Object.keys(images).forEach(imageName => {
		let ok = true;
		const image = images[imageName];

		if (!image.seasons.includes('all') && !image.seasons.includes(season)) {
			ok = false;
		}

		if (!image.conditions.includes('all') && !image.conditions.includes(condition)) {
			ok = false;
		}

		if (!image.daytime.includes('all') && !image.daytime.includes(daytime)) {
			ok = false;
		}

		if (ok) {
			foundImages.push(imageName);
		}
	});

	if (foundImages.length) {
		if (foundImages.length > 1) {
			foundImages = arrayShuffle(foundImages);
		}

		return foundImages[0];
	}

	return '';
};
