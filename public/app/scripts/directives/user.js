'use strict';

/**
 * @ngdoc directive
 * @name publicApp.directive:user
 * @description
 * # user
 */
app.directive('user', function ($compile) {
  return {
    link: function (scope, element, attrs) {
      var contentTr = angular.element('<p>TEST</p>');
      contentTr.insertBefore(element);
      $compile(contentTr)(scope);
    }
  }
});
