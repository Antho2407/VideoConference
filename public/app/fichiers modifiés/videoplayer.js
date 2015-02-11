'use strict';

/**
 * @ngdoc directive
 * @name publicApp.directive:VideoPlayer
 * @description
 * # VideoPlayer
 */
angular.module('publicApp')
  .directive('videoPlayer', function ($sce) {
    var muted = false;
    return {
      template: '<figure class="{{toggle}} effect-hera"><video id="video{{idUser}}" class="video-users" ng-src="{{trustSrc()}}" autoplay></video> <figcaption> <h2>{{nameUser}}</h2> <p><a href="javascript:void(0)" ng-click="muteVideo()" ><i class="fa fa-volume-off"></i></a></p></figcaption></figure>',
      restrict: 'E',
      replace: true,
      scope: {
        vidSrc: '@',
        idUser: '@',
        nameUser: '@',
        toggle: '@'
      },
      link: function (scope) {
        console.log('Initializing video-player');
        scope.trustSrc = function () {
          if (!scope.vidSrc) {
            return undefined;
          }
          return $sce.trustAsResourceUrl(scope.vidSrc);
        };
        scope.muteVideo = function () { 
          var id = "video"+scope.idUser;
          console.log("CLICK MUTE avant " + muted);
          muted = !muted;

          var video = document.getElementById(id);
          video.muted = muted;
          return;
        };
      }
    };
  });
