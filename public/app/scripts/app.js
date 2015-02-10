'use strict';

/**
 * @ngdoc overview
 * @name publicApp
 * @description
 * # publicApp
 *
 * Main module of the application.
 */

angular
  .module('publicApp', [
    'ngRoute'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/room/:roomId', {
        templateUrl: 'views/room.html',
        controller: 'RoomCtrl'
      })
      .when('/room', {
        templateUrl: 'views/room.html',
        controller: 'RoomCtrl'
      })
      .when('/connect/', {
        templateUrl: 'views/connection.html',
        controller: 'ConnectCtrl'
      })
      .when('/connect/:roomId', {
        templateUrl: 'views/connection.html',
        controller: 'ConnectCtrl'
      })
      .otherwise({
        //redirectTo: '/room'
        templateUrl: 'views/connection.html',
        controller: 'ConnectCtrl'
      });
  });

angular.module('publicApp')
  .constant('config', {
      SIGNALIG_SERVER_URL: undefined
  });

Object.setPrototypeOf = Object.setPrototypeOf || function(obj, proto) {
  obj.__proto__ = proto;
  return obj; 
};
