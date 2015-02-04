var express = require('express'),
    expressApp = express(),
    io = require('socket.io'),
    http = require('http'),
    server = http.createServer(expressApp),
    uuid = require('node-uuid'),
    rooms = {},
    userIds = {};

var tabLocations=[];
var tabUsers=[];

expressApp.use(express.static(__dirname + '/../public/app/'));
//expressApp.use(express.static(__dirname + '/../public/app/'));
//expressApp.use(express.static(__dirname + '/../public/app/'));
//expressApp.use('/bower_components',  express.static(__dirname + './bower_components'));

exports.run = function (config) {

  server.listen(config.PORT);
  console.log('Listening on', config.PORT);
  io.listen(server, { log: false })
  .on('connection', function (socket) {

    var currentRoom, id, name;

    socket.emit("getPseudo", function () {
    });

    socket.on('registerPseudo', function (pseudo) {
      name = pseudo;
    });

    socket.on('init', function (data, fn) {

      currentRoom = (data || {}).room || uuid.v4();
      var room = rooms[currentRoom];
      if (!data) {
        rooms[currentRoom] = [socket];
        id = userIds[currentRoom] = 0;

        var newUser = {
                id : id,
                name : name
            };
        tabUsers.push(newUser);

        fn(currentRoom, id, name, tabUsers);

        console.log('Room created, with #', currentRoom);
      } else {
        if (!room) {
          return;
        }
        userIds[currentRoom] += 1;
        id = userIds[currentRoom];

        var newUser = {
                id : id,
                name : name
          };
        tabUsers.push(newUser);

        fn(currentRoom, id, name, tabUsers);

        room.forEach(function (s) {
          s.emit('peer.connected', { id: id, name:name });
        });
        
        room[id] = socket;
        console.log('Peer connected to room', currentRoom, 'with #', id);       
      }
      //room.newUser({ id: id, name:name });
      //socket.emit('getLocation', currentRoom);
    });

    socket.on('msg', function (data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        //console.log('Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msg', data);
      } else {
        console.warn('Invalid user');
      }
    });

     socket.on('sendMessageToRoom', function (data) {
      if (rooms[currentRoom]) {
        console.log('Sending message to room');
        socket.broadcast.to(rooms[currentRoom]).emit('sendMessageToRoom', data);
      } else {
        console.warn('Invalid room');
      }
    });

    socket.on('sendPosition', function (position) {
    var newLocation = {
        idClient : socket.id,
        longitude : position.longitude,
        latitude : position.latitude
    };
    tabLocations.push(newLocation);
    socket.emit('newPositions', tabLocations); 
    socket.broadcast.emit('newPositions', tabLocations); // should be room only
  });

    socket.on('disconnect', function () {
      if (!currentRoom || !rooms[currentRoom]) {
        return;
      }
      delete rooms[currentRoom][rooms[currentRoom].indexOf(socket)];
      rooms[currentRoom].forEach(function (socket) {
        if (socket) {
          socket.emit('peer.disconnected', { id: id });
        }
      });
    });
  });
};