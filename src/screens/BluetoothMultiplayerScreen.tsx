import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BluetoothMultiplayerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bluetooth Multiplayer (Coming Soon)</Text>
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
  text: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
}); 