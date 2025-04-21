import axios from 'axios';

export const API_URL = 'http://172.21.58.106:3000/api';

// Fonction pour gérer les erreurs de manière uniforme
const handleApiError = (error) => {
  console.error('❌ API ERROR:', error);
  
  if (error.response) {
    // Erreur avec réponse du serveur
    console.error('📡 Réponse du serveur:', error.response.status, error.response.data);
    throw {
      status: error.response.status,
      message: error.response.data.message || 'Erreur serveur',
      data: error.response.data
    };
  } else if (error.request) {
    // Erreur sans réponse
    console.error('📡 Aucune réponse du serveur:', error.request);
    throw {
      status: 0,
      message: 'Aucune réponse du serveur. Vérifiez votre connexion réseau.'
    };
  } else {
    // Autre erreur
    console.error('⚠️ Autre erreur:', error.message);
    throw {
      status: 0,
      message: error.message || 'Une erreur est survenue'
    };
  }
};

// Authentification
export const login = async (email, password) => {
  console.log('🔐 Tentative de connexion pour:', email);
  try {
    console.log(`📡 Envoi requête POST vers ${API_URL}/auth/login`);
    const response = await axios.post(
      `${API_URL}/auth/login`,
      { email, password },
      { timeout: 10000 }
    );
    console.log('✅ Connexion réussie:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Échec de connexion:', error);
    return handleApiError(error);
  }
};

export const register = async (email, password) => {
  console.log('📝 Tentative d\'inscription pour:', email);
  try {
    console.log(`📡 Envoi requête POST vers ${API_URL}/auth/register`);
    const response = await axios.post(
      `${API_URL}/auth/register`,
      { email, password },
      { timeout: 10000 }
    );
    console.log('✅ Inscription réussie:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Échec d\'inscription:', error);
    return handleApiError(error);
  }
};

// Gestion des geocaches
export const getCaches = async (token) => {
  console.log('🔍 Récupération de toutes les caches');
  try {
    console.log(`📡 Envoi requête GET vers ${API_URL}/caches`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    const response = await axios.get(`${API_URL}/caches`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ ${response.data.length} caches récupérées`);
    return response.data;
  } catch (error) {
    console.error('❌ Échec de récupération des caches:', error);
    return handleApiError(error);
  }
};

export const getUserCaches = async (token) => {
  console.log('🔍 Récupération des caches de l\'utilisateur');
  try {
    console.log(`📡 Envoi requête GET vers ${API_URL}/caches/user`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    const response = await axios.get(`${API_URL}/caches/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ ${response.data.length} caches utilisateur récupérées`);
    return response.data;
  } catch (error) {
    console.error('❌ Échec de récupération des caches utilisateur:', error);
    return handleApiError(error);
  }
};

export const getNearbyCaches = async (token, latitude, longitude, radius = 5) => {
  console.log(`🔍 Recherche des caches à proximité: lat=${latitude}, long=${longitude}, rayon=${radius}km`);
  try {
    const url = `${API_URL}/caches/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`;
    console.log(`📡 Envoi requête GET vers ${url}`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ ${response.data.length} caches à proximité récupérées`);
    console.log('📦 Données reçues:', JSON.stringify(response.data).substring(0, 200) + '...');
    return response.data;
  } catch (error) {
    console.error('❌ Échec de récupération des caches à proximité:', error);
    return handleApiError(error);
  }
};

export const getCacheById = async (token, cacheId) => {
  console.log(`🔍 Récupération de la cache: ${cacheId}`);
  try {
    console.log(`📡 Envoi requête GET vers ${API_URL}/caches/${cacheId}`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    
    const response = await axios.get(
      `${API_URL}/caches/${cacheId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Cache récupérée:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Échec de récupération de la cache ${cacheId}:`, error);
    return handleApiError(error);
  }
};

export const createCache = async (token, cacheData) => {
  console.log('📝 Création d\'une nouvelle cache');
  console.log('📦 Données de la cache:', cacheData);
  try {
    // Configurer les bons headers pour multipart/form-data
    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await axios.post(
      `${API_URL}/caches`,
      cacheData,
      config
    );
    
    console.log('✅ Création réussie:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Échec de création de la cache:', error);
    return handleApiError(error);
  }
};

export const updateCache = async (token, cacheId, cacheData) => {
  console.log(`📝 Mise à jour de la cache: ${cacheId}`);
  console.log('📦 Nouvelles données:', JSON.stringify(cacheData));
  try {
    console.log(`📡 Envoi requête PUT vers ${API_URL}/caches/${cacheId}`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    
    const response = await axios.put(
      `${API_URL}/caches/${cacheId}`,
      cacheData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Mise à jour réussie:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Échec de mise à jour de la cache ${cacheId}:`, error);
    return handleApiError(error);
  }
};

export const deleteCache = async (token, cacheId) => {
  console.log(`🗑️ Suppression de la cache: ${cacheId}`);
  try {
    console.log(`📡 Envoi requête DELETE vers ${API_URL}/caches/${cacheId}`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    
    const response = await axios.delete(
      `${API_URL}/caches/${cacheId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Suppression réussie:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Échec de suppression de la cache ${cacheId}:`, error);
    return handleApiError(error);
  }
};

export const markCacheAsFound = async (token, cacheId, commentaire) => {
  console.log(`🏁 Marquage de la cache ${cacheId} comme trouvée`);
  console.log('💬 Commentaire:', commentaire || 'aucun');
  try {
    console.log(`📡 Envoi requête POST vers ${API_URL}/caches/${cacheId}/found`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    console.log('📦 Données envoyées:', { commentaire });
    
    const response = await axios.post(
      `${API_URL}/caches/${cacheId}/found`,
      { commentaire },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('✅ Cache marquée comme trouvée:', response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Échec de marquage de la cache ${cacheId}:`, error);
    return handleApiError(error);
  }
};

// Statistiques et classements
export const getUserRanking = async (token) => {
  console.log('🏆 Récupération du classement des utilisateurs');
  try {
    console.log(`📡 Envoi requête GET vers ${API_URL}/users/ranking`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    
    const response = await axios.get(
      `${API_URL}/users/ranking`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log(`✅ ${response.data.length} utilisateurs dans le classement`);
    return response.data;
  } catch (error) {
    console.error('❌ Échec de récupération du classement:', error);
    return handleApiError(error);
  }
};

export const getPopularCaches = async (token) => {
  console.log('🔝 Récupération des caches populaires');
  try {
    console.log(`📡 Envoi requête GET vers ${API_URL}/caches/popular`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    
    const response = await axios.get(
      `${API_URL}/caches/popular`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log(`✅ ${response.data.length} caches populaires récupérées`);
    return response.data;
  } catch (error) {
    console.error('❌ Échec de récupération des caches populaires:', error);
    return handleApiError(error);
  }
};

export const getRarelyCaches = async (token) => {
  console.log('🔍 Récupération des caches rarement trouvées');
  try {
    console.log(`📡 Envoi requête GET vers ${API_URL}/caches/rarely-found`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    
    const response = await axios.get(
      `${API_URL}/caches/rarely-found`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log(`✅ ${response.data.length} caches rarement trouvées récupérées`);
    return response.data;
  } catch (error) {
    console.error('❌ Échec de récupération des caches rarement trouvées:', error);
    return handleApiError(error);
  }
};

// Commentaires et détails
export const getCacheComments = async (token, cacheId) => {
  console.log(`💬 Récupération des commentaires pour la cache: ${cacheId}`);
  try {
    console.log(`📡 Envoi requête GET vers ${API_URL}/caches/${cacheId}/comments`);
    console.log('🔑 Token utilisé:', token ? `${token.substring(0, 10)}...` : 'aucun');
    
    const response = await axios.get(
      `${API_URL}/caches/${cacheId}/comments`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log(`✅ ${response.data.length} commentaires récupérés`);
    return response.data;
  } catch (error) {
    console.error(`❌ Échec de récupération des commentaires pour la cache ${cacheId}:`, error);
    return handleApiError(error);
  }
};
export const uploadAvatar = async (token, imageData) => {
  console.log('📝 Téléchargement de l\'avatar');
  
  try {
    const formData = new FormData();
    
    // Ajouter l'image à FormData
    const filename = imageData.uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('avatar', {
      uri: imageData.uri,
      name: filename,
      type
    });
    
    const response = await axios.post(
      `${API_URL}/users/avatar`,
      formData,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('✅ Avatar mis à jour:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Échec de mise à jour de l\'avatar:', error);
    return handleApiError(error);
  }
};