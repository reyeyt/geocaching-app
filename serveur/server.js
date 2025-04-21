// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');

// Routes
const authRoutes = require('./routes/auth');
const cachesRoutes = require('./routes/caches');
const usersRoutes = require('./routes/users');


// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS plus détaillée
app.use(cors({
  origin: '*', // Autorise toutes les origines
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware pour parser le JSON
app.use(express.json());

// Middleware de logging pour déboguer
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.method !== 'GET') {
    console.log('Body:', req.body);
  }
  next();
});

// Servir les fichiers statiques du dossier 'uploads'
app.use('/uploads', express.static('uploads'));
// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/caches', cachesRoutes);
app.use('/api/users', usersRoutes);
// Route pour tester l'API
app.get('/api', (req, res) => {
  res.json({ message: "API Geocaching disponible" });
});

// Route par défaut
app.get('/', (req, res) => {
  res.send('API de Geocaching fonctionne');
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur" });
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});