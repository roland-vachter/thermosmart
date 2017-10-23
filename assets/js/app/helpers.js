function pad(num, size) {
	let s = num+"";
	while (s.length < size) s = "0" + s;
	return s;
}

const getPercentInDay = function (hour, minute) {
	if (hour === undefined || minute === undefined) {
		const now = new Date();
		hour = now.getHours();
		minute = now.getMinutes();
	}

	const percentInDay = (hour * 60 + minute) * 100 / 1440;

	return percentInDay;
};




module.exports = {
	getPercentInDay,
	pad
};
