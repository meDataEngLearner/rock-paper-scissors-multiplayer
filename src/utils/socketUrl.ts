// Utility to get the correct Socket.IO server URL for emulator, real device, or production
import { Platform } from 'react-native';

// Set these constants to your actual deployment URLs
const PRODUCTION_URL = 'https://rock-paper-scissors-multiplayer-w3f2.onrender.com'; // Render server
const LAN_URL = 'http://192.168.1.7:3001'; // Local LAN IP for development

/**
 * Returns the correct Socket.IO server URL based on environment.
 * Update PRODUCTION_URL and LAN_URL above as needed.
 */
export const getSocketServerUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Socket] Connecting to local dev server:', LAN_URL);
    return LAN_URL;
  }
  console.log('[Socket] Connecting to production server:', PRODUCTION_URL);
  return PRODUCTION_URL;
}; 