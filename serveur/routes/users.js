// Dans routes/users.js
const router = require('express').Router();
const User = require('../models/users'); 
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
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


// Configuration de multer pour les uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5MB
});
router.get('/ranking', auth, async (req, res) => {
  try {
    const users = await User.find();
    
    const ranking = users.map(user => ({
      email: user.email,
      cachesTrouvees: user.cachesTrouvees ? user.cachesTrouvees.length : 0,
      avatar: user.avatar ? user.avatar.url : null // Ajouter l'URL de l'avatar
    })).sort((a, b) => b.cachesTrouvees - a.cachesTrouvees);
    
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }
    
    const user = await User.findById(req.user._id);
    
    user.avatar = {
      data: fs.readFileSync(req.file.path),
      contentType: req.file.mimetype
    };
    
    await user.save();
    
    // Suppression du fichier temporaire
    fs.unlinkSync(req.file.path);
    
    res.json({ message: 'Avatar mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Route pour récupérer l'avatar d'un utilisateur
router.get('/avatar/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user || !user.avatar || !user.avatar.data) {
      return res.status(404).send('Avatar non trouvé');
    }
    
    res.set('Content-Type', user.avatar.contentType);
    res.send(user.avatar.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
