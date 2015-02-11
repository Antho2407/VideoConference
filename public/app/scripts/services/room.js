/* global RTCIceCandidate, RTCSessionDescription, RTCPeerConnection, EventEmitter */
'use strict';

/**
 * @ngdoc service
 * @name publicApp.Room
 * @description
 * # Room
 * Factory in the publicApp.
 */
angular.module('publicApp')
  .factory('Room', function ($rootScope, $q, Io, config) {

    var iceConfig = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]},
        peerConnections = {},
        currentId, roomId,
        stream, currentName;

    $rootScope.users = [];

    function getPeerConnection(id, name) {

      if (peerConnections[id]) {
        return peerConnections[id];
      }

      var pc = new RTCPeerConnection(iceConfig);
      peerConnections[id] = pc;
      pc.addStream(stream);
      pc.onicecandidate = function (evnt) {
        socket.emit('msg', { by: currentId, to: id, ice: evnt.candidate, type: 'ice' });
      };
      pc.onaddstream = function (evnt) {
        console.log('Received new stream');

        api.trigger('peer.stream', [{
          id: id,
          name : name,
          stream: evnt.stream
        }]);
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
      };
      return pc;
    }

    function makeOffer(id, name) {
      var pc = getPeerConnection(id, name);
      pc.createOffer(function (sdp) {
        pc.setLocalDescription(sdp);
        console.log('Creating an offer for', id);
        socket.emit('msg', { by: currentId, to: id, sdp: sdp, type: 'sdp-offer' });
      }, function (e) {
        console.log(e);
      },
      { mandatory: { OfferToReceiveVideo: true, OfferToReceiveAudio: true }});
    }

    function handleMessage(data) {
      var pc = getPeerConnection(data.by);
      switch (data.type) {
        case 'sdp-offer':
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by offer');
            pc.createAnswer(function (sdp) {
              pc.setLocalDescription(sdp);
              socket.emit('msg', { by: currentId, to: data.by, sdp: sdp, type: 'sdp-answer' });
            });
          });
          break;
        case 'sdp-answer':
          pc.setRemoteDescription(new RTCSessionDescription(data.sdp), function () {
            console.log('Setting remote description by answer');
          }, function (e) {
            console.error(e);
          });
          break;
        case 'ice':
          if (data.ice) {
            console.log('Adding ice candidates');
            pc.addIceCandidate(new RTCIceCandidate(data.ice));
          }
          break;
      }
    }

    var socket = Io.connect(config.SIGNALIG_SERVER_URL),
        connected = false;

    socketMap = socket;

    function addHandlers(socket) {
      socket.on('peer.connected', function (params) {
        makeOffer(params.id, params.name);

        $rootScope.users.push({
          id: params.id,
          name: params.name
        });
      });
      socket.on('peer.disconnected', function (data) {
        api.trigger('peer.disconnected', [data]);
        $rootScope.users = $rootScope.users.filter(function (u) {
          return u.id !== data;
        });
        if (!$rootScope.$$digest) {
          $rootScope.$apply();
        }
      });
      socket.on('msg', function (data) {
        handleMessage(data);
      });
      socket.on('getPseudo', function (){
        bootbox.prompt({
          title: "Quel est votre pseudo ?",
          closeButton: false,
          value: "Gilbert 65 ans",
          callback: function(result) {
                    if ((result == null)||(result == "")) {
                        socket.emit('registerPseudo', 'Inconnu'); 
                    } else {
                      socket.emit('registerPseudo', result); 
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

    socket.on('getLocation', function (room, newUser){
      currentRoomMap = room;
      getLocation(newUser);
    });

    socket.on('newPositions', function (positions){
      positions.forEach(displayCoordinates);
    });

    socket.on('newPosition', function (position){
      newCoordinates(position);
    });

    // Occurs when we receive chat messages
    socket.on('messageSent', function (data, name){
      api.trigger('peer.messageSent', [{data:data, name:name}]);
    });

  };

    var api = {
      newUser : function (id, name, tabUsers) {
            $rootScope.users.push({
            id: id,
            name: name
            });
      },
      sendMessage : function (message, name) {
            socket.emit('sendMessageToRoom', message, currentName);
      },
      sendFichierPartage : function (params) {
            socket.emit('sendFichierToRoom', params);
      },
      joinRoom: function (r, pseudo) {
        socket.emit('registerPseudo', pseudo); 
        if (!connected) {
          socket.emit('init', { room: r }, function (roomid, id, name, tabUsers) {
            currentId = id;
            roomId = roomid;
            currentName = name;
            $rootScope.users = tabUsers;
          });
          connected = true;
        }
      },
      createRoom: function (pseudo) {
        socket.emit('registerPseudo', pseudo); 
        var d = $q.defer();
        socket.emit('init', null, function (roomid, id, name, tabUsers) {
          d.resolve(roomid);
          roomId = roomid;
          currentId = id;
          currentName = name;
          $rootScope.users = tabUsers;

          connected = true;
        });
        return d.promise;
      },
      init: function (s) {
        stream = s;
      }
    };

    EventEmitter.call(api);
    Object.setPrototypeOf(api, EventEmitter.prototype);

    addHandlers(socket);

    return api;
  });
