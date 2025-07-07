// Utility to get the correct Socket.IO server URL for emulator, real device, or production
import { Platform } from 'react-native';

// Set these constants to your actual deployment URLs
const PRODUCTION_URL = 'https://rock-paper-scissors-multiplayer-w3f2.onrender.com'; // Render server
const LAN_URL = 'http://192.168.1.7:3001'; // Local LAN IP for development

/**
 * Returns the correct Socket.IO server URL.
 * FORCED to production for Expo Go testing. Restore logic for local dev as needed.
 */
export const getSocketServerUrl = () => {
  console.log('[Socket] Connecting to production server (forced for Expo Go):', PRODUCTION_URL);
  return PRODUCTION_URL;
}; 