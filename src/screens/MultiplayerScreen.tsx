import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';

type MultiplayerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Multiplayer'>;

const { width } = Dimensions.get('window');

export default function MultiplayerScreen() {
  const navigation = useNavigation<MultiplayerScreenNavigationProp>();
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCreating(true);
    
    const newRoomId = generateRoomId();
    
    // In a real app, you would create the room on your server here
    // For now, we'll simulate it
    
    setTimeout(() => {
      setIsCreating(false);
      navigation.navigate('Room', { roomId: newRoomId, isHost: true });
    }, 1000);
  };

  const handleJoinRoom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!roomId.trim()) {
      Alert.alert('Error', 'Please enter a room ID');
      return;
    }
    
    // In a real app, you would validate the room exists on your server
    navigation.navigate('Room', { roomId: roomId.trim().toUpperCase(), isHost: false });
  };

  const handleShareRoom = async (roomIdToShare: string) => {
    try {
      const message = `Join my Rock Paper Scissors game! Room ID: ${roomIdToShare}`;
      await Sharing.shareAsync(message);
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Multiplayer</Text>
        <Text style={styles.subtitle}>Play with friends in real-time</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateRoom}
            disabled={isCreating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {isCreating ? 'Creating Room...' : 'Create Room'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.joinContainer}>
            <Text style={styles.joinLabel}>Join Room</Text>
            <TextInput
              style={styles.roomInput}
              placeholder="Enter Room ID"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={roomId}
              onChangeText={setRoomId}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleJoinRoom}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Join</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 50,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 30,
  },
  createButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 15,
    fontSize: 14,
  },
  joinContainer: {
    width: '100%',
    gap: 15,
  },
  joinLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  roomInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  joinButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
}); 