// Utility to get the correct Socket.IO server URL for emulator, real device, or production
import { Platform } from 'react-native';

// CHANGE THESE URLs based on your deployment
const PRODUCTION_URL = 'https://your-app-name.herokuapp.com'; // Replace with your actual deployed URL
const LAN_IP = '192.168.1.7'; // Your local LAN IP for development
const PORT = '3001';

export function getSocketServerUrl() {
  // Check if we're in production mode
  if (__DEV__ === false) {
    return PRODUCTION_URL;
  }
  
  // Development mode
  if (Platform.OS === 'android') {
    // On Android emulator, use special alias
    return 'http://10.0.2.2:' + PORT;
  }
  // On real device or iOS simulator, use LAN IP
  return `http://${LAN_IP}:${PORT}`;
} 