const router = require('express').Router();
const Cache = require('../models/Cache');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/users');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });


// Middleware d'authentification
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Accès refusé' });
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Token invalide' });
  }
};

// Récupérer toutes les caches
router.get('/', auth, async (req, res) => {
  try {
    const caches = await Cache.find();
    res.json(caches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Récupérer les caches à proximité
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // rayon en km
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude et longitude requises' });
    }
    
    // Convertir en nombres
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);
    
    // Récupérer toutes les caches (en pratique, vous utiliseriez une requête géospatiale)
    const allCaches = await Cache.find();
    
    // Filtrer manuellement les caches à proximité
    // Note: Dans un environnement de production, utilisez les requêtes géospatiales de MongoDB
    const nearbyCaches = allCaches.filter(cache => {
      const distance = calculateDistance(
        lat, lng,
        cache.coordinates.latitude, cache.coordinates.longitude
      );
      return distance <= rad;
    });
    
    res.json(nearbyCaches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fonction pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance en km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}
// Route pour les caches populaires
// Route pour les caches populaires
router.get('/popular', auth, async (req, res) => {
  try {
    const caches = await Cache.find();
    
    const popularCaches = caches
      .filter(cache => cache.findings && cache.findings.length >= 2)
      .map(cache => ({
        _id: cache._id,
        foundByCount: cache.findings.length
      }))
      .sort((a, b) => b.foundByCount - a.foundByCount)
      .slice(0, 10);
    
    res.json(popularCaches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour les caches rarement trouvées
router.get('/rarely-found', auth, async (req, res) => {
  try {
    const caches = await Cache.find();
    
    const rarelyCaches = caches
      .filter(cache => !cache.findings || cache.findings.length < 2)
      .map(cache => ({
        _id: cache._id,
        foundByCount: cache.findings ? cache.findings.length : 0
      }))
      .sort((a, b) => b.foundByCount - a.foundByCount) // Même celles avec 1 découverte d'abord
      .slice(0, 10);
    
    res.json(rarelyCaches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Récupérer une cache spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const cache = await Cache.findById(req.params.id);
    if (!cache) return res.status(404).json({ message: 'Cache non trouvée' });
    res.json(cache);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Modifier une cache
router.put('/:id', auth, async (req, res) => {
  try {
    const cache = await Cache.findById(req.params.id);
    if (!cache) return res.status(404).json({ message: 'Cache non trouvée' });
    
    // Vérifier si l'utilisateur est le créateur
    if (cache.creator.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette cache' });
    }
    
    const { coordinates, difficulty, description } = req.body;
    
    const updatedCache = await Cache.findByIdAndUpdate(
      req.params.id,
      { coordinates, difficulty, description },
      { new: true }
    );
    
    res.json(updatedCache);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Supprimer une cache
router.delete('/:id', auth, async (req, res) => {
  try {
    const cache = await Cache.findById(req.params.id);
    if (!cache) return res.status(404).json({ message: 'Cache non trouvée' });
    
    // Vérifier si l'utilisateur est le créateur
    if (cache.creator.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette cache' });
    }
    
    await Cache.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cache supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Marquer une cache comme trouvée
router.post('/:id/found', auth, async (req, res) => {
  try {
    const { commentaire } = req.body;
    const cache = await Cache.findById(req.params.id);
    
    if (!cache) return res.status(404).json({ message: 'Cache non trouvée' });
    // Vérifier si l'utilisateur est le créateur de la cache
    if (cache.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas marquer votre propre cache comme trouvée' });
    }
    
    // Vérifier si l'utilisateur a déjà trouvé cette cache
    const alreadyFound = cache.findings.some(finding => 
      finding.user.toString() === req.user._id
    );
    
    if (alreadyFound) {
      return res.status(400).json({ message: 'Vous avez déjà trouvé cette cache' });
    }
    
    // Ajouter l'utilisateur aux trouveurs
    cache.findings.push({
      user: req.user._id,
      found: true,
      comment: commentaire,
      date: new Date()
    });
    const user = await User.findById(req.user._id);
    user.cachesTrouvees.push({
      cache: cache._id,
      foundAt: new Date(),
      comment: commentaire
    });
    
    await cache.save();
    await user.save();
    res.status(200).json({ message: 'Cache marquée comme trouvée' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// Modifier la route de création pour utiliser multer
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Latitude brute:', req.body.latitude);
    console.log('Longitude brute:', req.body.longitude);
    if (!req.body) {
      return res.status(400).json({ message: 'Données manquantes - corps de requête vide' });
    }
    
    // Vérifiez si latitude et longitude existent
    if (!req.body.latitude || !req.body.longitude) {
      return res.status(400).json({ message: 'Coordonnées manquantes' });
    }
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);
    const difficulty = parseInt(req.body.difficulty || 3);
    const description = req.body.description || '';
    console.log('Latitude parsée:', latitude);
    console.log('Longitude parsée:', longitude);
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        message: 'Coordonnées invalides', 
        received: { lat: req.body.latitude, long: req.body.longitude } 
      });
    }
    const newCache = new Cache({
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      creator: req.user._id,
      difficulty: parseInt(difficulty),
      description: description || '',
      findings: []
    });
    
    // Ajouter la photo si elle existe
    if (req.file) {
      newCache.photo = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        url: req.file.path
      };
    }
    
    const savedCache = await newCache.save();
    res.status(201).json(savedCache);
  } catch (error) {
    console.error('Erreur de création de cache:', error);
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
