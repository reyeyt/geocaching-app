import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://172.21.58.106:3000/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const user = await AsyncStorage.getItem('userData');
      
      if (token && user) {
        setUserToken(token);
        setUserData(JSON.parse(user));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading auth data', error);
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = response.data;
      
      setUserToken(token);
      setUserData(user);
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  };

  const register = async (email, password) => {
    try {
      await axios.post(`${API_URL}/auth/register`, { email, password });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur d\'inscription'
      };
    }
  };

  const logout = async () => {
    setUserToken(null);
    setUserData(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        login, 
        register, 
        logout, 
        isLoading, 
        userToken, 
        userData 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
