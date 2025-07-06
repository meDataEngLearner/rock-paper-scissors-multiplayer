// Utility to get the correct Socket.IO server URL for emulator, real device, or production
import { Platform } from 'react-native';

// CHANGE THESE URLs based on your deployment
// Replace this with your actual Render URL after deployment
const PRODUCTION_URL = 'https://rock-paper-scissors-multiplayer-w3f2.onrender.com'; // Your deployed Render server
const LAN_IP = '192.168.1.7'; // Your local LAN IP for development
const PORT = '3001';

export function getSocketServerUrl() {
  // Use LAN IP for real device testing, localhost for emulator
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  } else {
    return `http://${LAN_IP}:${PORT}`;
  }
} 