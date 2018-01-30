'use strict';

const module = require('../module');

module.controller('modalSensorLabelCtrl', ['$scope', 'content', 'loginStatus', '$http', function ($scope, content, loginStatus, $http) {
	loginStatus.check();

	$scope.id = content.id;
	$scope.label = content.label;

	$scope.save = () => {
		$scope.$close({
			id: $scope.id,
			label: $scope.label
		});
	};
}]);
