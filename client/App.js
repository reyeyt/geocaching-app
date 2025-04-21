import React from 'react';
import { AuthProvider } from './src/Context/AuthContext';
import { ExpoRoot } from 'expo-router';

export default function App() {
  const ctx = require.context('./app');
  return (
    <AuthProvider>
      <ExpoRoot context={ctx} />
    </AuthProvider>
  );
}