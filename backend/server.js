require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./config/googleAuth');
const axios = require('axios');

const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const agentRoutes = require('./routes/agentRoutes');
const newsRoutes = require('./routes/newsRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();

// Configure CORS to allow requests from frontend and Chrome extension
app.use(cors({ 
    origin: [
        "http://localhost:5173",
        /^chrome-extension:\/\/.+$/  // Allow all Chrome extensions
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use(session({ 
    secret: process.env.SESSION_SECRET || 'your-secret-key', 
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        sameSite: 'lax' // Help with cross-site requests
    }
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Meeting API Proxy - forward requests to Python backend
app.use('/meeting', async (req, res) => {
    try {
        const meetingBackendUrl = process.env.MEETING_BACKEND_URL || 'http://localhost:8000';
        
        // Forward the request to the Python backend
        const response = await axios({
            method: req.method,
            url: `${meetingBackendUrl}${req.url}`,
            data: req.method !== 'GET' ? req.body : undefined,
            headers: {
                'Content-Type': 'application/json',
                // Forward auth headers if needed
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
            }
        });
        
        // Send the response back to the client
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Meeting API proxy error:', error.message);
        res.status(error.response?.status || 500).send(error.response?.data || { error: 'Meeting service unavailable' });
    }
});

app.use('/auth', authRoutes);
app.use('/email', emailRoutes);
app.use('/agent', agentRoutes);
app.use('/news', newsRoutes);
app.use('/history', historyRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
