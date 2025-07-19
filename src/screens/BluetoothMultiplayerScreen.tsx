import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useBluetooth } from '../utils/BluetoothContext';

export default function BluetoothMultiplayerScreen() {
  const {
    isHost,
    isConnected,
    deviceName,
    connectAsHost,
    connectAsGuest,
    error,
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
  },
  error: {
    color: '#ff5252',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
}); 