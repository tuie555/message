const socketIo = require('socket.io');
const http = require('http');
const uuid = require("uuid");
const pool = require('./db');
const cors = require('cors');
const express = require('express');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  }
});

app.use(cors());
app.use(express.json());

const activeUsers = new Map();
app.get('/a', async (req, res) => {
  res.send('hello');
})

app.get('/api/messages/:userid', async (req, res) => {
  const userId = req.params.userId;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({ error: 'Invalid userId parameter' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE receiver = $1 OR sender = $1 ORDER BY timestamp ASC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error retrieving messages:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

app.post('/api/message', async (req, res) => {
  const { sender, receiver, message } = req.body;

  try {
    // Insert message into the database
    await pool.query(
      'INSERT INTO messages (sender, receiver, message) VALUES ($1, $2, $3)',
      [sender, receiver, message]
    );

    // Send the message to the receiver if they are connected via Socket.IO
    if (activeUsers.has(receiver)) {
      const socketId = activeUsers.get(receiver);
      io.to(socketId).emit('private_message', message);
    }
    res.status(200).json({ message: 'Message sent and stored successfully' });
  } catch (err) {
    console.error('Error storing message:', err);
    res.status(500).json({ error: 'Failed to send/store message' });
  }
});

io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  socket.on('register', (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`User registered: ${userId}`);
  });

  socket.on('private_message', async ({ sender, to, message }) => {
    try {
      // Store message in PostgreSQL
      await pool.query(
        'INSERT INTO messages (sender, receiver, message) VALUES ($1, $2, $3)',
        [sender, to, message]
      );
      // Check if the recipient is online
      if (activeUsers.has(to)) {
        const socketId = activeUsers.get(to);
        io.to(socketId).emit('private_message', message);
      }
    } catch (err) {
      console.error('Error storing message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Remove user from active users map
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }
    }
  });
});

// Make the server listen on port 3000
app.listen(3032, () => {
  console.log('Server running at http://x526d.3bbddns.com:19542');
});