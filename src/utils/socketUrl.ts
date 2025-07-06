// Utility to get the correct Socket.IO server URL for emulator, real device, or production
import { Platform } from 'react-native';

// CHANGE THESE URLs based on your deployment
// Replace this with your actual Render URL after deployment
const PRODUCTION_URL = 'https://rock-paper-scissors-multiplayer-w3f2.onrender.com'; // Your deployed Render server
const LAN_IP = '192.168.1.7'; // Your local LAN IP for development
const PORT = '3001';

export const getSocketServerUrl = () => {
  const url = 'https://rock-paper-scissors-multiplayer-w3f2.onrender.com'; // or your Render URL
  console.log('[Socket] Connecting to socket server URL:', url);
  if (process.env.NODE_ENV === 'development') {
    // Use local server for development
    return 'http://192.168.1.7:3001';
  }
  // Use Render server for production
  return 'https://rock-paper-scissors-multiplayer-w3f2.onrender.com';
}; 