'use strict';

/**
 * @ngdoc function
 * @name publicApp.controller:RoomCtrl
 * @description
 * # RoomCtrl
 * Controller of the publicApp
 */
angular.module('publicApp')
  .controller('RoomCtrl', function ($sce, VideoStream, $location, $routeParams, $scope, Room, Connect) {

    if (!window.RTCPeerConnection || !navigator.getUserMedia) {
      $scope.error = 'WebRTC is not supported by your browser. You can try the app with Chrome and Firefox.';
      return;
    }

    var stream;
    var pseudo = Connect.get();

    VideoStream.get()
    .then(function (s) {
      stream = s;
      Room.init(stream);
      stream = URL.createObjectURL(stream);

       if (!$routeParams.roomId) {
        Room.createRoom(pseudo)
        .then(function (roomId) {
          $location.path('/room/' + roomId);
        });
      } else {
        Room.joinRoom($routeParams.roomId, pseudo);
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

    Room.on('peer.messageSent', function (params) {
     $scope.messages.push({
            avatar: "../images/avatar.png",
            text: params.name + " : " + params.data,
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
            text: "MOI MEME : " + $scope.messageText,
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
      $scope.handleClientLoad();
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
       * Check if the current user has authorized the application.
       */
      $scope.checkAuth = function() {
        gapi.auth.authorize(
            {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
            $scope.handleAuthResult);
      };

      /**
       * Called when the client library is loaded to start the auth flow.
       */
      $scope.handleClientLoad = function() {
        window.setTimeout($scope.checkAuth, 1);
      };

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
          filePicker.onchange = $scope.uploadFile;
        } else {
          // No access token could be retrieved, show the button to start the authorization flow.
          authButton.style.display = 'block';
          authButton.onclick = function() {
              gapi.auth.authorize(
                  {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
                  $scope.handleAuthResult);
          };
        }
      };

      /**
       * Start the file upload.
       *
       * @param {Object} evt Arguments from the file selector.
       */
      $scope.uploadFile = function(evt) {
        gapi.client.load('drive', 'v2', function() {
          var file = evt.target.files[0];
          console.log("test");
          $scope.insertFile(file, function(name, url){
                    if(arguments.length ==0){
                        console.log("error uploading file");
                    }else{
                      var params = {};
                      params.name = name; 
                      params.url = url; 
                      params.roomId = "";
                      
                      Room.sendFichierPartage(params);
                    }
                    
                });
        });
      };


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

          gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        }).execute(function(file) {
            if( file.error ){
                callback && callback();
            }
            gapi.client.drive.permissions.insert({
                'fileId': file.id,
                'resource': {
                    'value': null,
                    'type': "anyone",
                    'role': "reader"
                }
            }).execute(function(resp) {
                if( resp.error ){
                    callback && callback();
                }else{
                    callback && callback(file.title, file.webContentLink.replace("&export=download", ""));
                }
            });
          });
        }       
      };

      Room.on('peer.handleClientFile', function (params) {
        console.log("peer.handlefile");
        $scope.handleClientLoad();
      });
  });