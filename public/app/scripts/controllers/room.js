'use strict';

/**
 * @ngdoc function
 * @name publicApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the publicApp
 */
angular.module('publicApp')
  .controller('RoomCtrl', function ($sce, VideoStream, $location, $routeParams, $scope, Room) {

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      return;
    }

    var stream;

    VideoStream.get()
    .then(function (s) {
      stream = s;
      Room.init(stream);
      stream = URL.createObjectURL(stream);

      if (!$routeParams.roomId) {
        Room.createRoom()
        .then(function (roomId) {
          $location.path('/room/' + roomId);
        });
      } else {
        Room.joinRoom($routeParams.roomId);
      }
    }, function () {
      $scope.error = 'No audio/video permissions. Please refresh your browser and allow the audio/video capturing.';
    });
    
    $scope.peers = [];
    
    $scope.showDetails = [];
    Room.on('peer.stream', function (peer) {
      $scope.showDetails[peer.id] = true;
      console.log('Client connected, adding new stream');
  
      $scope.peers.push({
        id: peer.id,
        name: peer.name,
        stream: URL.createObjectURL(peer.stream)
      });
    });

    Room.on('peer.disconnected', function (peer) {
      console.log('Client disconnected, removing stream');
      $scope.peers = $scope.peers.filter(function (p) {
        return p.id !== peer.id;
      });
    });

    $scope.getLocalVideo = function () {
      return $sce.trustAsResourceUrl(stream);
    };

    $scope.togg = function(id) {
      $scope.showDetails[id] = ! $scope.showDetails[id];
      return;
    };

    $scope.trustSrc = function (vidSrc) {
        if (!vidSrc) {
          return undefined;
        }
        return $sce.trustAsResourceUrl(vidSrc);
      };
  });