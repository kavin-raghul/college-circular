const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const path = require('path');

// Route files
const authRoutes = require('./routes/authRoutes');
const circularRoutes = require('./routes/circularRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Trust proxy (required on Render for secure cookies)
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:3000',
  'https://college-circular-z26j.vercel.app',
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim().replace(/\/$/, ''))
    : [])
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'College Circular API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/dashboard', dashboardRoutes);

// App context for socket
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college-circular')
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
