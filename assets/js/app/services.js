/* global angular, io */

"use strict";

const module = require('./module');

module.service('socketio', ($rootScope) => {
	const socket = io.connect('/frontend');
	return {
		on: function(eventName, callback) {
			socket.on(eventName, function() {
				const args = arguments;
				$rootScope.$apply(function() {
					callback.apply(socket, args);
				});
			});
		},
		emit: function(eventName, data, callback) {
			socket.emit(eventName, data, function() {
				const args = arguments;
				$rootScope.$apply(function() {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			});
		}
	};
});

module.service('loginStatus', ($http) => {
	const url = '/login/facebook/checkstatus';

	return {
		check: function () {
			$http.get(url).then(function () {
				// do nothing, user is logged in
			}, function () {
				document.location.reload();
			});
		}
	}
});
