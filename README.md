# Application de Geocaching

Une application mobile de geocaching développée avec React Native (frontend) et Node.js/Express (backend). Cette application permet aux utilisateurs de créer et découvrir des caches géolocalisées, d'enregistrer leurs trouvailles et de participer à un classement communautaire.

## Fonctionnalités

- **Authentification** : Inscription et connexion des utilisateurs
- **Carte interactive** : Visualisation des caches à proximité sur une carte OpenStreetMap
- **Création de caches** : Ajout de nouvelles caches avec photos, description et niveau de difficulté
- **Découverte de caches** : Marquage des caches comme trouvées et ajout de commentaires
- **Profils utilisateurs** : Personnalisation avec avatars
- **Classements** : Meilleurs joueurs et statistiques sur les caches populaires/rares

## Technologies utilisées

### Backend
- Node.js & Express
- MongoDB avec Mongoose
- JWT pour l'authentification
- Bcrypt pour le hachage des mots de passe
- Multer pour la gestion des uploads de fichiers

### Frontend
- React Native
- Expo
- WebView intégrant Leaflet pour la cartographie
- AsyncStorage pour la persistence locale
- ImagePicker pour la sélection d'images

## Installation

### Prérequis
- Node.js (v14+)
- MongoDB
- Expo CLI

### Backend
1. Cloner le dépôt
2. Naviguer vers le dossier `serveur`
3. Installer les dépendances : `npm install`
4. Créer un fichier `.env` avec les variables suivantes :
