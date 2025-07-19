import React, { createContext, useContext, useState, useRef } from 'react';
import { BleManager, Device, Subscription, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

const GAME_SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const GAME_CHAR_UUID = '87654321-4321-4321-4321-ba0987654321';

interface BluetoothContextType {
  isHost: boolean;
  isConnected: boolean;
  deviceName: string | null;
  connectAsHost: () => void;
  connectAsGuest: () => void;
  sendMessage: (msg: string) => void;
  receivedMessage: string | null;
  error: string | null;
  discoveredDevices: Device[];
  selectDevice: (device: Device) => void;
  scanning: boolean;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [receivedMessage, setReceivedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const manager = useRef(new BleManager()).current;
  const connectedDevice = useRef<Device | null>(null);
  const subscription = useRef<Subscription | null>(null);

  // Host: Start advertising (not supported in JS, would need native code or workaround)
  const connectAsHost = async () => {
    setIsHost(true);
    setError('BLE advertising as host is not supported in JS-only RN. Use Android/iOS native code or a workaround.');
    // In a real app, use a native module or workaround to advertise a custom service.
  };

  // Guest: Scan for devices advertising the game service
  const connectAsGuest = async () => {
    setIsHost(false);
    setScanning(true);
    setError(null);
    setDiscoveredDevices([]);
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setError('Bluetooth scan permission denied.');
        setScanning(false);
        return;
      }
    }
    manager.startDeviceScan([GAME_SERVICE_UUID], null, (error, device) => {
      if (error) {
        setError(error.message);
        setScanning(false);
        return;
      }
      if (device && device.name && !discoveredDevices.find(d => d.id === device.id)) {
        setDiscoveredDevices(prev => [...prev, device]);
      }
    });
  };

  // Guest: Select a device to connect
  const selectDevice = async (device: Device) => {
    setError(null);
    setScanning(false);
    manager.stopDeviceScan();
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      connectedDevice.current = connected;
      setDeviceName(connected.name || connected.id);
      setIsConnected(true);
      // Subscribe to characteristic notifications
      const char = await connected.readCharacteristicForService(GAME_SERVICE_UUID, GAME_CHAR_UUID);
      subscription.current = connected.monitorCharacteristicForService(
        GAME_SERVICE_UUID,
        GAME_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            setError(error.message);
            return;
          }
          if (characteristic?.value) {
            const msg = Buffer.from(characteristic.value, 'base64').toString('utf8');
            setReceivedMessage(msg);
          }
        }
      );
    } catch (e: any) {
      setError('Connection failed: ' + e.message);
    }
  };

  // Send a message (guest -> host or host -> guest)
  const sendMessage = async (msg: string) => {
    if (!connectedDevice.current) {
      setError('Not connected to a device.');
      return;
    }
    try {
      const base64msg = Buffer.from(msg, 'utf8').toString('base64');
      await connectedDevice.current.writeCharacteristicWithResponseForService(
        GAME_SERVICE_UUID,
        GAME_CHAR_UUID,
        base64msg
      );
    } catch (e: any) {
      setError('Send failed: ' + e.message);
    }
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
      discoveredDevices,
      selectDevice,
      scanning,
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