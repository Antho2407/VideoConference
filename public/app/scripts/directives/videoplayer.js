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
      template: '<div class="{{toggle}}"><video id="video{{idUser}}" ng-src="{{trustSrc()}}" autoplay></video><div class="video_controls"><a href="javascript:void(0)" ng-click="muteVideo()"><img src="images/" alt="RSS" style="border:none" /></a></div></div>',
      restrict: 'E',
      replace: true,
      scope: {
        vidSrc: '@',
        idUser: '@',
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
