module.exports = function(io, streams) {

      io.on('connection', function(socket) {

            socket.emit('id', socket.id);

            socket.on('readyToStream', function(options) {
                  console.log('-- ' + socket.id + ' is ready to stream --');
                  streams.addStream(socket.id, options.name);
            });
                
            socket.on('update', function(options) {
                  streams.update(socket.id, options.name);
            });
            
            // convenience function to log server messages on the client
            function log() {
              var array = ['Message from server:'];
              array.push.apply(array, arguments);
              socket.emit('log', array);
            }
            
            socket.on('message', function(message) {
              log('Client said: ', message);
              // for a real app, would be room-only (not broadcast)
              socket.broadcast.emit('message', message);
            });
          
            socket.on('create or join', function(room) {
              log('Received request to create or join room ' + room);
              
              var clientsInRoom = io.sockets.adapter.rooms.get(room);
              var numClients = clientsInRoom ? clientsInRoom.size : 0;
              log('Room ' + room + ' now has ' + numClients + ' client(s)');
          
              if (numClients === 0) {
                socket.join(room);
                log('Client ID ' + socket.id + ' created room ' + room);
                socket.emit('created', room, socket.id);
              } else if (numClients === 1) {
                log('Client ID ' + socket.id + ' joined room ' + room);
                io.sockets.in(room).emit('join', room);
                socket.join(room);
                socket.emit('joined', room, socket.id);
                io.sockets.in(room).emit('ready');
              } else { // max two clients
                socket.emit('full', room);
              }
              updateNumOfClients();
          
            });
          
            socket.on('ipaddr', function() {
              var ifaces = os.networkInterfaces();
              for (var dev in ifaces) {
                ifaces[dev].forEach(function(details) {
                  if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                  }
                });
              }
            });
          
            function leave() {
              console.log('-- ' + socket.id + ' left --');
              updateNumOfClients();
              streams.removeStream(socket.id);
            }
          
            function updateNumOfClients(){
              var numClients = io.sockets.sockets.size;
              console.log(numClients + ' in the room')
              socket.emit('update number of clients', numClients);
            }
          
            socket.on('request number of clients', updateNumOfClients);
            socket.on('disconnect', leave);
            socket.on('leave', leave);
          
          });

    };
    