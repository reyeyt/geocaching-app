import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { 
  login,
  register,
  getCaches,
  getUserCaches,
  getNearbyCaches, 
  getCacheById,
  createCache, 
  updateCache,
  deleteCache,
  markCacheAsFound,
  getUserRanking,
  getPopularCaches,
  getRarelyCaches,
  getCacheComments
} from '../src/api/geocachingApi';

export default function App() {
  // États pour l'écran de connexion
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // États pour la carte
  const [mapVisible, setMapVisible] = useState(false);
  const [location, setLocation] = useState(null);
  const [caches, setCaches] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // États pour l'ajout de cache
  const [addCacheVisible, setAddCacheVisible] = useState(false);
  const [difficulty, setDifficulty] = useState('3');
  const [description, setDescription] = useState('');
  
  // États pour l'édition de cache
  const [editCacheVisible, setEditCacheVisible] = useState(false);
  const [selectedCache, setSelectedCache] = useState(null);
  
  // États pour les classements et statistiques
  const [rankingVisible, setRankingVisible] = useState(false);
  const [userRanking, setUserRanking] = useState([]);
  const [popularCaches, setPopularCaches] = useState([]);
  const [rarelyCaches, setRarelyCaches] = useState([]);


  // États pour les photos
const [selectedImage, setSelectedImage] = useState(null);


  // Vérifier si un token est déjà stocké au démarrage
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const user = await AsyncStorage.getItem('userData');
        
        if (token && user) {
          setUserToken(token);
          setUserData(JSON.parse(user));
          setMapVisible(true);
          requestLocation();
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setIsLoading(false);
      }
    };
    
    checkToken();
  }, []);

// Fonction de connexion
const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Erreur', 'Veuillez remplir tous les champs');
    return;
  }
  
  try {
    setIsLoading(true);
    const response = await login(email, password);
    const { token, user } = response;
    
    // Normalisation des données utilisateur
    const normalizedUser = {
      ...user,
      _id: user.id  // Ajouter _id basé sur la valeur de id
    };
    
    setUserToken(token);
    setUserData(normalizedUser);  // Utiliser les données normalisées
    
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(normalizedUser));  // Stocker les données normalisées
    
    Alert.alert('Succès', 'Connexion réussie!');
    setMapVisible(true);
    requestLocation();
  } catch (error) {
    Alert.alert('Erreur de connexion', error.message || 'Identifiants incorrects');
  } finally {
    setIsLoading(false);
  }
};

  // Fonction d'inscription
  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      setIsLoading(true);
      await register(email, password);
      Alert.alert(
        'Succès', 
        'Compte créé avec succès', 
        [{ text: 'OK', onPress: () => setIsRegister(false) }]
      );
    } catch (error) {
      Alert.alert('Erreur d\'inscription', error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    setUserToken(null);
    setUserData(null);
    setMapVisible(false);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  };

  
  const requestLocation = async () => {
    // Position fixe: ENSEIRB-MATMECA à Talence
    // J'utilise des coordonnées fixes au lieu de la géolocalisation réelle
    // car l'émulateur renvoie par défaut les coordonnées de Mountain View (siège de Google)
    // et nous voulons simuler une position en France pour tester l'application
    setLocation({
      latitude: 44.807380,
      longitude: -0.605882,
    });
    console.log("Position définie sur ENSEIRB-MATMECA (Talence)");
   };

  // Charger les caches à proximité
  const loadNearbyCaches = async () => {
    if (!location || !userToken) return;
    
    try {
      setIsLoading(true);
      const data = await getNearbyCaches(userToken, location.latitude, location.longitude, 5);
      console.log("Caches reçues:", JSON.stringify(data));
      setCaches(data);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de charger les caches à proximité');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les classements
  const loadRankings = async () => {
    try {
      setIsLoading(true);
      const [rankingData, popularData, rarelyData] = await Promise.all([
        getUserRanking(userToken),
        getPopularCaches(userToken),
        getRarelyCaches(userToken)
      ]);
      
      setUserRanking(rankingData);
      setPopularCaches(popularData);
      setRarelyCaches(rarelyData);
      setRankingVisible(true);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de charger les classements');
    } finally {
      setIsLoading(false);
    }
  };

  // Effet pour charger les caches quand la localisation change
  useEffect(() => {
    if (location && userToken) {
      loadNearbyCaches();
    }
  }, [location, userToken]);

  // Ajouter une cache
  const handleAddCache = async () => {
    if (!selectedLocation) {
      Alert.alert('Erreur', 'Veuillez sélectionner un emplacement sur la carte');
      return;
    }
  
    if (!difficulty || isNaN(Number(difficulty)) || Number(difficulty) < 1 || Number(difficulty) > 5) {
      Alert.alert('Erreur', 'La difficulté doit être un nombre entre 1 et 5');
      return;
    }
  
    try {
      setIsLoading(true);
      const cacheData = new FormData();
      
      // Ajouter les données de base - utiliser selectedLocation au lieu de location
      cacheData.append('latitude', selectedLocation.latitude.toString());
      cacheData.append('longitude', selectedLocation.longitude.toString());
      cacheData.append('difficulty', difficulty.toString());
      cacheData.append('description', description);
      
      // Ajouter la photo si elle existe
      if (selectedImage) {
        const filename = selectedImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        cacheData.append('photo', {
          uri: selectedImage,
          name: filename,
          type
        });
      }
  
      await createCache(userToken, cacheData);
      
      // Réinitialiser l'image sélectionnée et la position sélectionnée
      setSelectedImage(null);
      setSelectedLocation(null);
      
      Alert.alert('Succès', 'Cache ajoutée avec succès');
      setAddCacheVisible(false);
      loadNearbyCaches();
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de créer la cache');
    } finally {
      setIsLoading(false);
    }
  };

  // Modifier une cache
  const handleEditCache = async () => {
    if (!selectedCache) {
      return;
    }

    if (!difficulty || isNaN(Number(difficulty)) || Number(difficulty) < 1 || Number(difficulty) > 5) {
      Alert.alert('Erreur', 'La difficulté doit être un nombre entre 1 et 5');
      return;
    }

    try {
      setIsLoading(true);
      const cacheData = {
        difficulty: Number(difficulty),
        description: description
      };

      await updateCache(userToken, selectedCache._id, cacheData);
      
      Alert.alert('Succès', 'Cache modifiée avec succès');
      setEditCacheVisible(false);
      setSelectedCache(null);
      loadNearbyCaches();
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de modifier la cache');
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer une cache
  const handleDeleteCache = async (cacheId) => {
    try {
      setIsLoading(true);
      await deleteCache(userToken, cacheId);
      
      Alert.alert('Succès', 'Cache supprimée avec succès');
      loadNearbyCaches();
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de supprimer la cache');
    } finally {
      setIsLoading(false);
    }
  };

  // Marquer une cache comme trouvée
  const handleMarkAsFound = async (cacheId, comment = '') => {
    try {
      setIsLoading(true);
      console.log(`Marquage cache: ${cacheId}, Commentaire: ${comment}`);
      await markCacheAsFound(userToken, cacheId, comment);
      
      Alert.alert('Succès', 'Cache marquée comme trouvée!');
      loadNearbyCaches();
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de marquer la cache comme trouvée');
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir l'écran d'édition de cache
  const openEditCacheScreen = (cache) => {
    setSelectedCache(cache);
    setDifficulty(cache.difficulty.toString());
    setDescription(cache.description || '');
    setEditCacheVisible(true);
  };

  // Générer le HTML pour la carte Leaflet
  const generateLeafletHtml = () => {
    // Extraire l'ID utilisateur en dehors du template string
    const userId = userData?._id || '';
    console.log("UserID extrait:", userId);
    
    // Ajout de débogage pour userData et userToken
    console.log("DEBUG - userData:", userData);
    console.log("DEBUG - userData type:", typeof userData);
    console.log("DEBUG - userData._id:", userData?._id);
    console.log("DEBUG - userToken:", userToken ? userToken.substring(0, 10) + "..." : "undefined");
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
        <style>
          body { padding: 0; margin: 0; }
          html, body, #map { height: 100%; width: 100%; }
          .custom-popup { text-align: center; }
          .find-button, .edit-button, .delete-button {
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            font-weight: bold;
            display: block;
            width: 100%;
            margin-bottom: 5px;
          }
          .find-button {
            background-color: #4CAF50;
            color: white;
          }
          .edit-button {
            background-color: #2196F3;
            color: white;
          }
          .delete-button {
            background-color: #f44336;
            color: white;
          }
          .cache-info {
            margin-bottom: 10px;
          }
          .cache-comments {
            margin-top: 10px;
            border-top: 1px solid #eee;
            padding-top: 10px;
            text-align: left;
          }
          .comment {
            margin-bottom: 5px;
            font-size: 14px;
          }
          .comment-author {
            font-weight: bold;
          }
          .cache-image {
            width: 100%;
            max-width: 200px;
            margin: 10px auto;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          // Définir l'ID utilisateur en JS
          const currentUserId = "${userId}";
          console.log("ID utilisateur dans JS:", currentUserId);
  
          // Initialiser la carte
          const map = L.map('map').setView([${location?.latitude || 44.837789}, ${location?.longitude || -0.57918}], 15);
          
          // Ajouter la couche de tuiles OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          
          // Ajouter un marqueur pour la position de l'utilisateur
          const userIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });
          
          L.marker([${location?.latitude || 44.837789}, ${location?.longitude || -0.57918}], {icon: userIcon})
            .addTo(map)
            .bindPopup('Votre position')
            .openPopup();
          
          // Icône pour les caches
          const cacheIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });
          
          // Icône pour les caches trouvées
          const foundCacheIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });
          
          // Debug function
          function logCacheDetails(cache) {
            console.log('Cache ID:', cache._id);
            console.log('Creator:', cache.creator);
            console.log('foundBy:', cache.foundBy);
            console.log('findings:', cache.findings);
            console.log('comments:', cache.comments);
            console.log('photo:', cache.photo);
          }
          
          // Ajouter les caches à la carte
          ${caches.map(cache => {
            // Debug log for each cache
            console.log(`Traitement cache: ${JSON.stringify(cache)}`);
            
            // Check if user found the cache (check both foundBy and findings)
            const isFound = 
              (cache.foundBy && Array.isArray(cache.foundBy) && cache.foundBy.includes(userId)) || 
              (cache.findings && Array.isArray(cache.findings) && cache.findings.some(finding => {
                if (typeof finding === 'string') return finding === userId;
                return finding.user === userId;
              }));
            
            // Check if user is the owner of the cache
            const isOwner = cache.creator === userId;
            
            // Log pour déboguer
            console.log("DEBUG - cache:", cache._id.substring(0, 6));
            console.log("DEBUG - cache creator:", cache.creator);
            console.log("DEBUG - userId:", userId);
            console.log("DEBUG - isOwner:", isOwner);
            
            // Get comments from the cache
            const comments = cache.comments || [];
            
            return `
              // Afficher les détails de la cache dans la console
              logCacheDetails(${JSON.stringify(cache)});
              
              L.marker([${cache.coordinates.latitude}, ${cache.coordinates.longitude}], {
                icon: ${isFound ? 'foundCacheIcon' : 'cacheIcon'}
              })
                .addTo(map)
                .bindPopup(\`
                  <div class="custom-popup">
                    <div class="cache-info">
                      <h3>Cache #${cache._id.substring(0, 6)}</h3>
                      
                      <!-- Afficher l'image si elle existe -->
                      ${cache.photo && cache.photo.url ? 
                        `<img src="http://172.21.58.106:3000/${cache.photo.url}" class="cache-image" alt="Photo de la cache">` 
                        : ''}
                      
                      <p>Difficulté: ${cache.difficulty}/5</p>
                      ${cache.description ? `<p>${cache.description}</p>` : ''}
                      ${!isFound && !isOwner ? `<button class="find-button" onclick="markCacheAsFound('${cache._id}')">J'ai trouvé cette cache!</button>` : isOwner ? '<p><em>Vous avez créé cette cache</em></p>' : '<p><strong>Cache trouvée ✓</strong></p>'}
                    </div>
                    
                    ${isOwner ? `
                    <button class="edit-button" onclick="editCache('${cache._id}')">Modifier</button>
                    <button class="delete-button" onclick="deleteCache('${cache._id}')">Supprimer</button>
                    ` : `<p><em>Créée par ${cache.creatorEmail || 'un autre utilisateur'}</em></p>`}
                    
                    ${comments.length > 0 ? `
                    <div class="cache-comments">
                      <h4>Commentaires:</h4>
                      ${comments.map(comment => `
                        <div class="comment">
                          <span class="comment-author">${comment.authorEmail || 'Anonyme'}:</span>
                          ${comment.text}
                        </div>
                      `).join('')}
                    </div>
                    ` : ''}
                  </div>
                \`);
            `;
          }).join('')}
          
          // Fonction pour marquer une cache comme trouvée
         // Fonction pour marquer une cache comme trouvée
          function markCacheAsFound(cacheId) {
            // Afficher une alerte simple avant le prompt
            alert("Vous allez marquer cette cache comme trouvée");
            
            // Utiliser prompt standard
            const comment = prompt("Ajouter un commentaire (facultatif):", "");
            
            // Envoyer les données
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MARK_FOUND',
              cacheId: cacheId,
              comment: comment || ''
            }));
          }
          
          // Fonction pour modifier une cache
          function editCache(cacheId) {
            console.log('Édition de la cache:', cacheId);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'EDIT_CACHE',
              cacheId: cacheId
            }));
          }
          
          // Fonction pour supprimer une cache
          function deleteCache(cacheId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette cache?')) {
              console.log('Suppression de la cache:', cacheId);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'DELETE_CACHE',
                cacheId: cacheId
              }));
            }
          }
          
          // Ajouter un listener de clic sur la carte
          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MAP_CLICK',
              latitude: e.latlng.lat,
              longitude: e.latlng.lng
            }));
          });
        </script>
      </body>
      </html>
    `;
  };
  // Gérer les messages de la WebView
  const onMapMessage = (event) => {
    try {
      console.log("Message reçu de la WebView:", event.nativeEvent.data);
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'MAP_CLICK') {
        console.log("AVANT MISE À JOUR - Location actuelle:", location?.latitude, location?.longitude);
        console.log("NOUVELLES COORDONNÉES SÉLECTIONNÉES:", data.latitude, data.longitude);
        
        // Au lieu de modifier la position de l'utilisateur, on stocke la position sélectionnée
        setSelectedLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });

        setAddCacheVisible(true);

        
        // Log après la mise à jour (mais attention, 
        // ce log s'exécutera avant que l'état ne soit réellement mis à jour à cause de l'asynchronicité)
        console.log("APRÈS APPEL setLocation - Remarque: l'état n'est probablement pas encore mis à jour:", location?.latitude, location?.longitude);
        
        setAddCacheVisible(true);
      } else if (data.type === 'MARK_FOUND') {
        handleMarkAsFound(data.cacheId, data.comment);
      } else if (data.type === 'EDIT_CACHE') {
        console.log("Édition de cache demandée:", data.cacheId);
        const cache = caches.find(c => c._id === data.cacheId);
        if (cache) {
          console.log("Cache trouvée pour édition:", cache);
          openEditCacheScreen(cache);
        } else {
          console.error("Cache non trouvée pour l'édition");
        }
      } else if (data.type === 'DELETE_CACHE') {
        console.log("Suppression de cache demandée:", data.cacheId);
        handleDeleteCache(data.cacheId);
      }
    } catch (e) {
      console.error('Erreur parsing message WebView:', e);
    }
  };
  
  // Afficher l'écran de profil
  const renderProfileScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.emailText}>{userData?.email}</Text>
      
      <TouchableOpacity style={styles.button} onPress={loadRankings}>
        <Text style={styles.buttonText}>Voir les classements</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setMapVisible(true)}>
        <Text style={styles.buttonText}>Revenir à la carte</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
  
  
  // Afficher l'écran d'ajout de cache
const renderAddCacheScreen = () => {
  console.log("VALEURS AU MOMENT DU RENDU:", location?.latitude, location?.longitude);
  return (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Ajouter une nouvelle cache</Text>
    
    <Text style={styles.label}>Coordonnées</Text>
    <View style={styles.coordinatesContainer}>
      <Text>Latitude: {location ? location.latitude : 'Non définie'}</Text>
      <Text>Longitude: {location ? location.longitude : 'Non définie'}</Text>
    </View>
    
    <Text style={styles.label}>Difficulté (1-5)</Text>
    <TextInput
      style={styles.input}
      value={difficulty}
      onChangeText={setDifficulty}
      keyboardType="number-pad"
      maxLength={1}
    />
    
    <Text style={styles.label}>Description</Text>
    <TextInput
      style={[styles.input, styles.textArea]}
      value={description}
      onChangeText={setDescription}
      multiline
      numberOfLines={4}
      placeholder="Décrivez l'emplacement, donnez des indices..."
    />
    
    <Text style={styles.label}>Photo (optionnelle)</Text>
    <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
      <Text style={styles.secondaryButtonText}>Choisir une photo</Text>
    </TouchableOpacity>
    
    {selectedImage && (
      <View style={styles.photoContainer}>
        <Image source={{ uri: selectedImage }} style={styles.photo} />
      </View>
    )}
    
    <TouchableOpacity style={styles.button} onPress={handleAddCache}>
      <Text style={styles.buttonText}>Ajouter la cache</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.secondaryButton} onPress={() => setAddCacheVisible(false)}>
      <Text style={styles.secondaryButtonText}>Annuler</Text>
    </TouchableOpacity>
  </ScrollView>
)};
  
  // Afficher l'écran d'édition de cache
  const renderEditCacheScreen = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Modifier la cache</Text>
      
      <Text style={styles.label}>Coordonnées</Text>
      <View style={styles.coordinatesContainer}>
        <Text>Latitude: {selectedCache?.coordinates.latitude.toFixed(6)}</Text>
        <Text>Longitude: {selectedCache?.coordinates.longitude.toFixed(6)}</Text>
      </View>
      
      <Text style={styles.label}>Difficulté (1-5)</Text>
      <TextInput
        style={styles.input}
        value={difficulty}
        onChangeText={setDifficulty}
        keyboardType="number-pad"
        maxLength={1}
      />
      
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        placeholder="Décrivez l'emplacement, donnez des indices..."
      />
      
      <TouchableOpacity style={styles.button} onPress={handleEditCache}>
        <Text style={styles.buttonText}>Enregistrer les modifications</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => {
        setEditCacheVisible(false);
        setSelectedCache(null);
      }}>
        <Text style={styles.secondaryButtonText}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  );
  
  // Afficher l'écran de classements
  const renderRankingScreen = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Classements</Text>
      
      <Text style={styles.sectionTitle}>Meilleurs joueurs</Text>
        {userRanking.length > 0 ? (
          userRanking.map((user, index) => (
            <View key={index} style={styles.rankingItem}>
              {user.avatar ? (
                <Image 
                  source={{ uri: `http://172.21.58.106:3000/${user.avatar}` }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{user.email.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.rankingPosition}>{index + 1}</Text>
              <Text style={styles.rankingName}>{user.email}</Text>
              <Text style={styles.rankingScore}>{user.cachesTrouvees} caches</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucun classement disponible</Text>
        )}
      
      <Text style={styles.sectionTitle}>Caches les plus populaires</Text>
      {popularCaches.length > 0 ? (
        popularCaches.map((cache, index) => (
          <View key={index} style={styles.rankingItem}>
            <Text style={styles.rankingPosition}>{index + 1}</Text>
            <Text style={styles.rankingName}>Cache #{cache._id.substring(0, 6)}</Text>
            <Text style={styles.rankingScore}>{cache.foundByCount} découvertes</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>Aucune cache populaire disponible</Text>
      )}
      
      <Text style={styles.sectionTitle}>Caches rarement trouvées</Text>
      {rarelyCaches.length > 0 ? (
        rarelyCaches.map((cache, index) => (
          <View key={index} style={styles.rankingItem}>
            <Text style={styles.rankingPosition}>{index + 1}</Text>
            <Text style={styles.rankingName}>Cache #{cache._id.substring(0, 6)}</Text>
            <Text style={styles.rankingScore}>{cache.foundByCount} découvertes</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>Aucune cache rarement trouvée disponible</Text>
      )}
      
      <TouchableOpacity style={styles.button} onPress={() => setRankingVisible(false)}>
        <Text style={styles.buttonText}>Retour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
  // Fonction pour sélectionner une image de la galerie
const pickImage = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la galerie');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  } catch (error) {
    console.error("Erreur lors de la sélection d'une image:", error);
    Alert.alert("Erreur", "Impossible de sélectionner l'image");
  }
};
  
  // Afficher l'écran d'authentification (login/register)
  const renderAuthScreen = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Application Geocaching</Text>
      
      {isRegister ? (
        // Écran d'inscription
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>S'inscrire</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsRegister(false)}>
            <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </>
      ) : (
        // Écran de connexion
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Connexion</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsRegister(true)}>
            <Text style={styles.link}>Pas encore de compte ? S'inscrire</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
  
  // Afficher la vue de chargement
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Chargement...</Text>
      </View>
    );
  }
  
  // Afficher la vue principale selon l'état de l'application
  if (!userToken) {
    return renderAuthScreen();
  }
  
  if (rankingVisible) {
    return renderRankingScreen();
  }
  
  if (editCacheVisible) {
    return renderEditCacheScreen();
  }
  
  if (addCacheVisible) {
    return renderAddCacheScreen();
  }
  
  if (mapVisible) {
    return (
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <WebView
            source={{ html: generateLeafletHtml() }}
            style={styles.map}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            onMessage={onMapMessage}
          />
        </View>
        
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={styles.tabButton}
            onPress={() => setMapVisible(true)}
          >
            <Text style={styles.tabButtonText}>Carte</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tabButton}
            onPress={() => setAddCacheVisible(true)}
          >
            <Text style={styles.tabButtonText}>Ajouter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tabButton}
            onPress={() => setMapVisible(false)}
          >
            <Text style={styles.tabButtonText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return renderProfileScreen();
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  button: {
    width: '100%',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#4CAF50',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBar: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  coordinatesContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  emailText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rankingPosition: {
    width: 30,
    fontWeight: 'bold',
    fontSize: 16,
  },
  rankingName: {
    flex: 1,
    fontSize: 16,
  },
  rankingScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 15,
  },
  photoButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  photoContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
});