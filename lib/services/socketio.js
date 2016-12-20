"use strict";

var socketIo = require('socket.io');

exports.io = {};

exports.init = function (server) {
	exports.io = socketIo(server);
};
