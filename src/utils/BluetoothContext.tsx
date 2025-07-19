import React, { createContext, useContext, useState, useRef } from 'react';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';

interface BluetoothContextType {
  isHost: boolean;
  isConnected: boolean;
  deviceName: string | null;
  connectAsHost: () => void;
  connectAsGuest: () => void;
  sendMessage: (msg: string) => void;
  receivedMessage: string | null;
  error: string | null;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [receivedMessage, setReceivedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const manager = useRef(new BleManager()).current;
  const connectedDevice = useRef<Device | null>(null);
  const subscription = useRef<Subscription | null>(null);

  // Placeholder: Implement BLE logic for host/guest, advertising, scanning, connecting, messaging
  const connectAsHost = () => {
    setIsHost(true);
    setError('Bluetooth host mode not fully implemented yet.');
  };
  const connectAsGuest = () => {
    setIsHost(false);
    setError('Bluetooth guest mode not fully implemented yet.');
  };
  const sendMessage = (msg: string) => {
    setError('Bluetooth sendMessage not implemented.');
  };

  return (
    <BluetoothContext.Provider value={{
      isHost,
      isConnected,
      deviceName,
      connectAsHost,
      connectAsGuest,
      sendMessage,
      receivedMessage,
      error,
    }}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const ctx = useContext(BluetoothContext);
  if (!ctx) throw new Error('useBluetooth must be used within BluetoothProvider');
  return ctx;
}; 