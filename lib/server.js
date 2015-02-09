var express = require('express'),
    expressApp = express(),
    io = require('socket.io'),
    http = require('http'),
    server = http.createServer(expressApp),
    uuid = require('node-uuid'),
    rooms = {},
    userIds = {};

var tabLocations={};
var tabUsers={};

expressApp.use(express.static(__dirname + '/../public/app/'));

var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.error.bind(console, 'connection successful:');
});

var fileSchema = mongoose.Schema({
  //id: String
    //url: String
    name: String
})
var FichierPartage = mongoose.model('FichierPartage', fileSchema)

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
      var newUser;
      if (!data) {
        rooms[currentRoom] = [socket];
        id = userIds[currentRoom] = 0;

        newUser = {
          id : id,
          name : name
        };

        tabUsers[currentRoom] = new Array();
        tabLocations[currentRoom] = new Array();
        tabUsers[currentRoom].push(newUser);

        fn(currentRoom, id, name, tabUsers[currentRoom]);

        console.log('Room created, with #', currentRoom);
      } else {
        if (!room) {
          return;
        }
        userIds[currentRoom] += 1;
        id = userIds[currentRoom];

        newUser = {
          id : id,
          name : name
        };

        tabUsers[currentRoom].push(newUser);

        fn(currentRoom, id, name, tabUsers[currentRoom]);

        room.forEach(function (s) {
          s.emit('peer.connected', { id: id, name:name });
        });
        
        room[id] = socket;
        console.log('Peer connected to room', currentRoom, 'with #', id);       
      }
      //room.newUser({ id: id, name:name });
      socket.emit('getLocation', currentRoom, newUser);
    });

    socket.on('msg', function (data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        rooms[currentRoom][to].emit('msg', data);
      } else {
        console.warn('Invalid user');
      }
    });

     socket.on('sendMessageToRoom', function (data) {
      //if (rooms[currentRoom]) {
        //socket.broadcast.to(rooms[currentRoom]).emit('sendMessageToRoom', data);
      rooms[currentRoom].forEach(function (s) {
        if(s==socket)
          return;
        console.log("EMIT MESSAGE SENT " + data);
        s.emit('messageSent', data);
      });
      //} else {
      //  console.warn('Invalid room');
      //}
    });

    socket.on('sendPosition', function (position, roomId, user) {
    var newLocation = {
        idClient : user.id,
        nameClient : user.name,
        longitude : position.longitude,
        latitude : position.latitude
    };
    tabLocations[roomId].push(newLocation);
    socket.emit('newPositions', tabLocations[roomId]); 
    //socket.broadcast.emit('newPositions', tabLocations[roomId]); // should be room only
    rooms[currentRoom].forEach(function (s) {
          if(s != socket)
            s.emit('newPosition', newLocation);
        });
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