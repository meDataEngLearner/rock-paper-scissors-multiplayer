import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import io, { Socket } from 'socket.io-client';
import { getSocketServerUrl } from '../utils/socketUrl';

type RoomScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Room'>;
type RoomScreenRouteProp = RouteProp<RootStackParamList, 'Room'>;

const { width } = Dimensions.get('window');
const SOCKET_SERVER_URL = getSocketServerUrl();

export default function RoomScreen() {
  const navigation = useNavigation<RoomScreenNavigationProp>();
  const route = useRoute<RoomScreenRouteProp>();
  const { roomId, isHost } = route.params;
  
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerCount, setPlayerCount] = useState(1);

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL);
    setSocket(s);
    s.emit('join_room', roomId);
    s.on('player_update', (count) => {
      setPlayerCount(count);
      setOpponentJoined(count === 2);
    });
    s.on('both_joined', () => {
      setOpponentJoined(true);
    });
    s.on('room_full', () => {
      Alert.alert('Room Full', 'This room already has 2 players.');
      navigation.goBack();
    });
    return () => {
      s.emit('leave_room', roomId);
      s.disconnect();
    };
  }, [roomId]);

  const handleCopyRoomId = async () => {
    try {
      await Clipboard.setStringAsync(roomId);
      setCopied(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.log('Error copying to clipboard:', error);
    }
  };

  const handleShareRoom = async () => {
    try {
      const message = `Join my Rock Paper Scissors game! Room ID: ${roomId}`;
      await Sharing.shareAsync(message);
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleStartGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Game', { mode: 'multiplayer', roomId });
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomLabel}>Room ID</Text>
          <View style={styles.roomIdContainer}>
            <Text style={styles.roomId}>{roomId}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyRoomId}
              activeOpacity={0.7}
            >
              <Text style={styles.copyButtonText}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {isHost && (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareRoom}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.shareButtonGradient}
              >
                <Text style={styles.shareButtonText}>Share Room</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusContainer}>
          {!opponentJoined ? (
            <View style={styles.waitingContainer}>
              <View style={styles.loadingDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
              <Text style={styles.waitingText}>Waiting for opponent... ({playerCount}/2)</Text>
              <Text style={styles.waitingSubtext}>
                Share the room ID with a friend to start playing
              </Text>
            </View>
          ) : (
            <View style={styles.readyContainer}>
              <View style={styles.readyIcon}>
                <Text style={styles.readyIconText}>✓</Text>
              </View>
              <Text style={styles.readyText}>Opponent joined!</Text>
              <Text style={styles.readySubtext}>Ready to start the game</Text>
              
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartGame}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4facfe', '#00f2fe']}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>Start Game</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  roomInfo: {
    alignItems: 'center',
    width: '100%',
  },
  roomLabel: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  roomIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  roomId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 15,
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  shareButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  waitingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4facfe',
    marginHorizontal: 4,
    opacity: 0.6,
  },
  waitingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  waitingSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  readyContainer: {
    alignItems: 'center',
  },
  readyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4facfe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  readyIconText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  readyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  readySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 30,
  },
  startButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 