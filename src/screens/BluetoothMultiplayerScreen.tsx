import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useBluetooth } from '../utils/BluetoothContext';
import { Device } from 'react-native-ble-plx';

export default function BluetoothMultiplayerScreen() {
  const {
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
  } = useBluetooth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Multiplayer</Text>
      {!isConnected ? (
        <>
          <TouchableOpacity style={styles.button} onPress={connectAsHost}>
            <Text style={styles.buttonText}>Host Game</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={connectAsGuest}>
            <Text style={styles.buttonText}>Join Game</Text>
          </TouchableOpacity>
          {scanning && (
            <View style={{ marginTop: 20 }}>
              <ActivityIndicator size="large" color="#43e97b" />
              <Text style={styles.status}>Scanning for devices...</Text>
              <FlatList
                data={discoveredDevices}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.deviceButton} onPress={() => selectDevice(item)}>
                    <Text style={styles.deviceText}>{item.name || item.id}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.status}>No devices found yet.</Text>}
                style={{ marginTop: 10, maxHeight: 200 }}
              />
            </View>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
        </>
      ) : (
        <>
          <Text style={styles.status}>Connected as {isHost ? 'Host' : 'Guest'}</Text>
          {deviceName && <Text style={styles.status}>Connected to: {deviceName}</Text>}
          <Text style={styles.status}>Ready to play!</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#43e97b',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  error: {
    color: '#ff5252',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  deviceButton: {
    backgroundColor: '#222a36',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },
  deviceText: {
    color: '#fff',
    fontSize: 16,
  },
}); 