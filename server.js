const app = require ('express') ();
const cors = require ('cors');
const port = process.env.PORT || 3000;
const httpServer = require ('http').createServer (app);
const formatMessage = require ('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require ('./utils/users');
app.use (
  cors ({
    origin: 'https://devvicktor.github.io',
  })
);
const io = require ('socket.io') (httpServer, {
  cors: {
    origin: 'https://devvicktor.github.io',
    methods: ['GET', 'POST'],
  },
  transports: ['polling'],
});
const botName = 'ZetiAlpha Bot';
io.on ('connection', socket => {
  /////////////////////////////
  ///////// socket join toon
  //////////////////////////////
  socket.on ('joinRoom', ({username, room}) => {
    //joined room
    const user = userJoin (socket.id, username, room);
    socket.join (user.room,`${user.username} joined room`);
    console.log (user.room);
    //welcome user to chat
    socket.emit (
      'chat message',
      formatMessage (botName, 'Welcome to ChatCord!')
    );
    //broad cast when user connects
    // socket.broadcact
    //   .to (user.room)
    //   .emit (
    //     'chat message',
    //     formatMessage (botName, `${user.username} has joined the chat`)
    //   );

    //get room users
    // Send users and room info
    io.to (user.room).emit ('roomUsers', {
      room: user.room,
      users: getRoomUsers (user.room),
    });
  });
  ///////////////////////////////////
  /////////lets send data across
  /////////////////////////////////////
  socket.on ('chat message', msg => {
    console.log ('message: ' + msg);
    const user = getCurrentUser (socket.id);
    console.log ('user', user);
    console.log ('socketid', socket.id);
    io.to (user.room).emit ('chat message', formatMessage (user.username, msg));
  });
  ///////////////////////
  ////////leave room
  ///////////////////////
  // Runs when client disconnects
  socket.on ('disconnect', () => {
    const user = userLeave (socket.id);

    if (user) {
      io
        .to (user.room)
        .emit (
          'chat message',
          formatMessage (botName, `${user.username} has left the chat`)
        );

      // Send users and room info
      io.to (user.room).emit ('roomUsers', {
        room: user.room,
        users: getRoomUsers (user.room),
      });
    }
  });
});
//////////////////////////
//////////serving
///////////////////////////
httpServer.listen (port, () => {
  console.log ('listening on *:3000');
});
