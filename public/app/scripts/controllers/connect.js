'use strict';

angular.module('publicApp')
  .controller('ConnectCtrl', function ($scope, $routeParams, $location, Connect, Room) {

    var changeLocation = function(url, forceReload) {
      $scope = $scope || angular.element(document).scope();
      if(forceReload || $scope.$$phase) {
        window.location = url;
      }
      else {
        //only use this if you want to replace the history stack
        //$location.path(url).replace();

        //this this if you want to change the URL and add it to the history stack
        $location.path(url);
        $scope.$apply();
      }
    };

    bootbox.prompt({
          title: "Quel est votre pseudo ?",
          closeButton: false,
          value: "Gilbert 65 ans",
          callback: function(result) {
                    var pseudo = "";
                    if ((result == null)||(result == "")) {
                        //socket.emit('registerPseudo', 'Inconnu');
                        pseudo = "Inconnu";
                    } else {
                        pseudo = result;
                        //socket.emit('registerPseudo', result); 
                    }

                    if (!$routeParams.roomId) {
                      Connect.set(pseudo);
                      changeLocation('#/room/', true);
                    }else{
                      Connect.set(pseudo);
                      changeLocation('#/room/'+$routeParams.roomId, true);
                    }   
              },
          buttons: {
            confirm: {   
              label: "Chatter !",
              className: "btn-success"
            },
            cancel: {   
              label: "Fuir",
              className: "btn-danger"
            }
          }
        });
  });