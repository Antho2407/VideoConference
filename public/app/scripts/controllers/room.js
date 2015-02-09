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

    // Messages, client info & sending
    $scope.messages = [];
    
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

    Room.on('peer.messageSent', function (data) {
      console.log('MESSAGE SENT' + data);
     $scope.messages.push({
            avatar: "../images/avatar.png",
            text: data,
            side: 'left'
        });         
      $scope.$apply();     

      // Animate
      $("#viewport-content").animate({
          bottom: $("#viewport-content").height() - $("#viewport").height()
      }, 250);
    });

    $scope.sendMessage = function () {

      $scope.messages.push({
           avatar: "../images/yeoman.png",
            text: $scope.messageText,
            side: 'right'
        });         
      $scope.$apply();     

      // Animate
      $("#viewport-content").animate({
          bottom: $("#viewport-content").height() - $("#viewport").height()
      }, 250);

        Room.sendMessage($scope.messageText);
        $scope.messageText = null;       
    };

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

      var CLIENT_ID = '779716103918-mjv16b6fbcp4afotr13pecgnc95aq2at.apps.googleusercontent.com';
      var SCOPES = 'https://www.googleapis.com/auth/drive';

      /**
       * Called when the client library is loaded to start the auth flow.
       */
      $scope.handleClientLoad = function() {
        window.setTimeout(checkAuth, 1);
      }

      /**
       * Check if the current user has authorized the application.
       */
      $scope.checkAuth = function() {
        gapi.auth.authorize(
            {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
            handleAuthResult);
      }

      /**
       * Called when authorization server replies.
       *
       * @param {Object} authResult Authorization result.
       */
      $scope.handleAuthResult = function(authResult) {
        var authButton = document.getElementById('authorizeButton');
        var filePicker = document.getElementById('filePicker');
        authButton.style.display = 'none';
        filePicker.style.display = 'none';
        if (authResult && !authResult.error) {
          // Access token has been successfully retrieved, requests can be sent to the API.
          filePicker.style.display = 'block';
          filePicker.onchange = uploadFile;
        } else {
          // No access token could be retrieved, show the button to start the authorization flow.
          authButton.style.display = 'block';
          authButton.onclick = function() {
              gapi.auth.authorize(
                  {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
                  handleAuthResult);
          };
        }
      }

      /**
       * Start the file upload.
       *
       * @param {Object} evt Arguments from the file selector.
       */
      $scope.uploadFile = function(evt) {
        gapi.client.load('drive', 'v2', function() {
          var file = evt.target.files[0];
          insertFile(file);
        });
      }


        /**
       * Insert new file.
       *
       * @param {File} fileData File object to read data from.
       * @param {Function} callback Function to call when the request is complete.
       */
      $scope.insertFile = function(fileData, callback) {
        var boundary = '-------314159265358979323846';
        var delimiter = "\r\n--" + boundary + "\r\n";
        var close_delim = "\r\n--" + boundary + "--";

        var reader = new FileReader();
        reader.readAsBinaryString(fileData);
        reader.onload = function(e) {
          var contentType = fileData.type || 'application/octet-stream';
          var metadata = {
            'title': fileData.name,
            'mimeType': contentType
          };

          var base64Data = btoa(reader.result);
          var multipartRequestBody =
              delimiter +
              'Content-Type: application/json\r\n\r\n' +
              JSON.stringify(metadata) +
              delimiter +
              'Content-Type: ' + contentType + '\r\n' +
              'Content-Transfer-Encoding: base64\r\n' +
              '\r\n' +
              base64Data +
              close_delim;

          var request = gapi.client.request({
              'path': '/upload/drive/v2/files',
              'method': 'POST',
              'params': {'uploadType': 'multipart'},
              'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
              },
              'body': multipartRequestBody});
          if (!callback) {
            callback = function(file) {
              console.log(file);
              var params = {};
              params.name = fileData.name; 
              Room.sendFichierPartage(params);
              /*
              var fichier = new FichierPartage({ name: fileData.name })
              console.log(fichier.name) // 'Silence'

              fluffy.save(function (err, fluffy) {
              if (err) return console.error(err);
                console.log(fichier.name);
              });

              FichierPartage.find(function (err, fichiers) {
              if (err) return console.error(err);
                console.log(fichiers)
              })
              */

            };
          }
          request.execute(callback);
        }
      };
  });