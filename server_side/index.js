const socketIo = require('socket.io');
const http = require('http');
const cors = require('cors');
const express = require('express');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
});

const activeUsers = new Map();
app.get('/a', async (req, res) => {
  res.send('hello');
})

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Make the server listen on port 3050
server.listen(3050, () => {
  console.log('Server running at http://localhost:3050');
});