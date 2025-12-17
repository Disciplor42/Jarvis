import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Database Setup
const sqlite = sqlite3.verbose();
const db = new sqlite.Database('./jarvis.db', (err) => {
  if (err) console.error('Database error: ', err);
  else console.log('Connected to JARVIS secure database.');
});

// Initialize Tables
db.serialize(() => {
  // Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT
  )`);

  // User Data Table
  db.run(`CREATE TABLE IF NOT EXISTS user_data (
    username TEXT PRIMARY KEY,
    data TEXT
  )`);
});

// --- AUTH ROUTES ---

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({error: "Missing credentials"});

    const initialData = JSON.stringify({ 
        tasks: [], 
        events: [], 
        memory: [],
        notes: [],
        folders: [],
        projects: [],
        settings: {
            googleApiKey: '',
            groqApiKey: '',
            models: {
                friday: '',
                jarvis: '',
                vision: '',
                transcription: ''
            }
        }
    });

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
        if (err) {
            return res.status(400).json({ error: "Username already exists." });
        }
        // Initialize Empty Data
        db.run(`INSERT INTO user_data (username, data) VALUES (?, ?)`, [username, initialData]);
        res.json({ success: true });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT password FROM users WHERE username = ?`, [username], (err, row) => {
        if(err) return res.status(500).json({error: "Server error"});
        if(!row || row.password !== password) {
            return res.status(401).json({error: "Invalid credentials"});
        }
        res.json({ success: true });
    });
});

// --- DATA ROUTES ---

// Get Data
app.get('/api/data', (req, res) => {
  const username = req.headers['x-username'];
  if(!username) return res.status(401).json({error: "No user specified"});

  db.get('SELECT data FROM user_data WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: 'Retrieval failed.' });
    if (!row) return res.json({}); 
    res.json(JSON.parse(row.data));
  });
});

// Sync Data
app.post('/api/data', (req, res) => {
  const username = req.headers['x-username'];
  if(!username) return res.status(401).json({error: "No user specified"});

  const dataString = JSON.stringify(req.body);
  db.run('INSERT OR REPLACE INTO user_data (username, data) VALUES (?, ?)', [username, dataString], (err) => {
    if (err) return res.status(500).json({ error: 'Save failed.' });
    res.json({ success: true });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`JARVIS Server Online on Port ${PORT}`);
});