import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SocketProvider } from './src/utils/SocketContext';
import { BluetoothProvider } from './src/utils/BluetoothContext';

import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import MultiplayerScreen from './src/screens/MultiplayerScreen';
import RoomScreen from './src/screens/RoomScreen';
import BluetoothMultiplayerScreen from './src/screens/BluetoothMultiplayerScreen';

export type RoundMode = '3' | '5' | '9' | 'no-limit';

export type RootStackParamList = {
  Home: undefined;
  Game:
    | { mode: 'computer'; roundMode: RoundMode }
    | { mode: 'multiplayer'; roomId: string; playerNumber: number; roundMode: RoundMode };
  Multiplayer: { roundMode: RoundMode };
  Room: { roomId: string; isHost: boolean; roundMode: RoundMode };
  BluetoothMultiplayer: { roundMode: RoundMode };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SocketProvider>
          <BluetoothProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                  headerStyle: {
                    backgroundColor: '#1a1a2e',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                  cardStyle: { backgroundColor: '#16213e' },
                }}
              >
                <Stack.Screen 
                  name="Home" 
                  component={HomeScreen} 
                  options={{ title: 'Rock Paper Scissors' }}
                />
                <Stack.Screen 
                  name="Game" 
                  component={GameScreen} 
                  options={{ title: 'Game' }}
                />
                <Stack.Screen 
                  name="Multiplayer" 
                  component={MultiplayerScreen} 
                  options={{ title: 'Multiplayer' }}
                />
                <Stack.Screen 
                  name="Room" 
                  component={RoomScreen} 
                  options={{ title: 'Game Room' }}
                />
                <Stack.Screen
                  name="BluetoothMultiplayer"
                  component={BluetoothMultiplayerScreen}
                  options={{ title: 'Bluetooth Multiplayer' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </BluetoothProvider>
        </SocketProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 