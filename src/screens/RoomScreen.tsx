import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useSocket } from '../utils/SocketContext';

type RoomScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Room'>;
type RoomScreenRouteProp = RouteProp<RootStackParamList, 'Room'>;

const { width } = Dimensions.get('window');

export default function RoomScreen() {
  const navigation = useNavigation<RoomScreenNavigationProp>();
  const route = useRoute<RoomScreenRouteProp>();
  const { roomId, isHost } = route.params;
  
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds countdown
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const [joinAttempts, setJoinAttempts] = useState(0);
  const maxJoinAttempts = 5;
  const joinRetryDelay = 700; // ms
  const [playerNumber, setPlayerNumber] = useState<number>(0);
  const [opponentLeftModal, setOpponentLeftModal] = useState(false);
  const [opponentTimeoutModal, setOpponentTimeoutModal] = useState(false);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    console.log('[RoomScreen] Initializing with roomId:', roomId, 'isHost:', isHost);

    let joinTimeout: NodeJS.Timeout | null = null;

    const tryJoinRoom = (attempt: number) => {
      if (attempt > maxJoinAttempts) {
        Alert.alert('Room Not Found', 'This room ID does not exist. Please check the room ID and try again.');
        navigation.goBack();
        return;
      }
      setJoinAttempts(attempt);
      console.log(`[RoomScreen] Guest join attempt ${attempt} for room:`, roomId);
      socket.emit('join_room', roomId);
    };

    const onConnect = () => {
      console.log('[RoomScreen] Connected to server');
      if (isHost) {
        console.log('[RoomScreen] I am the HOST, creating room:', roomId);
        console.log('[RoomScreen] Emitting create_room for:', roomId);
        socket.emit('create_room', roomId);
      } else {
        tryJoinRoom(1);
      }
    };

    if (socket.connected) {
      onConnect();
    }
    socket.on('connect', onConnect);

    const onRoomCreated = (createdRoomId: string) => {
      console.log('[RoomScreen] Room created:', createdRoomId);
      setIsRoomCreated(true);
    };
    socket.on('room_created', onRoomCreated);

    const onRoomExists = () => {
      console.log('[RoomScreen] Room already exists');
      Alert.alert('Room Exists', 'This room ID already exists. Please try a different room ID.');
      navigation.goBack();
    };
    socket.on('room_exists', onRoomExists);

    const onRoomFull = () => {
      console.log('[RoomScreen] Room is full');
      Alert.alert('Room Full', 'This room already has 2 players.');
      navigation.goBack();
    };
    socket.on('room_full', onRoomFull);

    const onRoomTimeout = () => {
      console.log('[RoomScreen] Room timed out');
      Alert.alert('Room Timeout', 'No opponent joined within 60 seconds. Please create a new room.');
      navigation.goBack();
    };
    socket.on('room_timeout', onRoomTimeout);

    const onPlayerUpdate = (count: number) => {
      console.log('[RoomScreen] Player update:', count);
      console.log('[RoomScreen] Setting opponentJoined to:', count === 2);
      setPlayerCount(count);
      setOpponentJoined(count === 2);
    };
    socket.on('player_update', onPlayerUpdate);

    const onPlayerNumber = (num: number) => {
      setPlayerNumber(num);
      console.log('[RoomScreen] Received player number:', num);
    };
    socket.on('player_number', onPlayerNumber);

    const onGameStart = () => {
      console.log('[RoomScreen] Game starting!');
      console.log('[RoomScreen] Navigating to Game screen with mode: multiplayer, roomId:', roomId);
      navigation.replace('Game', { mode: 'multiplayer', roomId, playerNumber });
    };
    socket.on('game_start', onGameStart);

    const onDisconnect = (reason: string) => {
      console.log('[RoomScreen] Disconnected:', reason);
    };
    socket.on('disconnect', onDisconnect);

    const onReconnect = (attemptNumber: number) => {
      console.log('[RoomScreen] Reconnected after', attemptNumber, 'attempts');
      if (isHost) {
        socket.emit('create_room', roomId);
      } else {
        socket.emit('join_room', roomId);
      }
    };
    socket.on('reconnect', onReconnect);

    const onReconnectError = (error: any) => {
      console.log('[RoomScreen] Reconnection error:', error);
    };
    socket.on('reconnect_error', onReconnectError);

    const onReconnectFailed = () => {
      console.log('[RoomScreen] Reconnection failed');
      Alert.alert('Connection Lost', 'Unable to reconnect to the server. Please try again.');
    };
    socket.on('reconnect_failed', onReconnectFailed);

    const onRoomNotFound = () => {
      if (!isHost && joinAttempts < maxJoinAttempts) {
        // Retry after delay
        joinTimeout = setTimeout(() => {
          tryJoinRoom(joinAttempts + 1);
        }, joinRetryDelay);
      } else {
        console.log('[RoomScreen] Room not found after retries');
        Alert.alert('Room Not Found', 'This room ID does not exist. Please check the room ID and try again.');
        navigation.goBack();
      }
    };
    socket.on('room_not_found', onRoomNotFound);

    const onOpponentLeft = () => {
      setOpponentLeftModal(true);
    };
    socket.on('opponent_left', onOpponentLeft);

    const onOpponentTimeout = () => {
      setOpponentTimeoutModal(true);
    };
    socket.on('opponent_timeout', onOpponentTimeout);

    return () => {
      if (joinTimeout) clearTimeout(joinTimeout);
      console.log('[RoomScreen] Cleanup - leaving room');
      socket.emit('leave_room', roomId);
      // Remove all listeners for this screen
      socket.off('connect', onConnect);
      socket.off('room_created', onRoomCreated);
      socket.off('room_exists', onRoomExists);
      socket.off('room_full', onRoomFull);
      socket.off('room_timeout', onRoomTimeout);
      socket.off('player_update', onPlayerUpdate);
      socket.off('player_number', onPlayerNumber);
      socket.off('game_start', onGameStart);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect', onReconnect);
      socket.off('reconnect_error', onReconnectError);
      socket.off('reconnect_failed', onReconnectFailed);
      socket.off('room_not_found', onRoomNotFound);
      socket.off('opponent_left', onOpponentLeft);
      socket.off('opponent_timeout', onOpponentTimeout);
    };
  }, [roomId, isHost, socket, joinAttempts, playerNumber]);

  // Countdown timer for room timeout
  useEffect(() => {
    if (isHost && isRoomCreated && !opponentJoined) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isHost, isRoomCreated, opponentJoined]);

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

  // Modal action handlers
  const handleRestart = () => {
    setOpponentLeftModal(false);
    setOpponentTimeoutModal(false);
    // Optionally, you can implement a restart logic here
    navigation.goBack();
  };
  const handleQuit = () => {
    setOpponentLeftModal(false);
    setOpponentTimeoutModal(false);
    navigation.goBack();
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
                {isHost 
                  ? 'Share the room ID with a friend to start playing'
                  : 'Waiting for the host to be ready'
                }
              </Text>
              {isHost && timeLeft > 0 && (
                <Text style={styles.timerText}>Time remaining: {timeLeft}s</Text>
              )}
            </View>
          ) : (
            <View style={styles.readyContainer}>
              <View style={styles.readyIcon}>
                <Text style={styles.readyIconText}>✓</Text>
              </View>
              <Text style={styles.readyText}>Opponent joined!</Text>
              <Text style={styles.readySubtext}>Starting game...</Text>
            </View>
          )}
        </View>
      </View>
      {/* Opponent Left Modal */}
      <Modal
        visible={opponentLeftModal}
        transparent
        animationType="fade"
        onRequestClose={handleQuit}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#222', borderRadius: 16, padding: 28, alignItems: 'center', width: '80%' }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Opponent Left</Text>
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 24, textAlign: 'center' }}>
              Your opponent has left the game. You can restart or quit.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity style={{ flex: 1, marginRight: 8, backgroundColor: '#4facfe', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={handleRestart}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, marginLeft: 8, backgroundColor: '#e94560', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={handleQuit}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Quit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Opponent Timeout Modal */}
      <Modal
        visible={opponentTimeoutModal}
        transparent
        animationType="fade"
        onRequestClose={handleQuit}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#222', borderRadius: 16, padding: 28, alignItems: 'center', width: '80%' }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Opponent Timeout</Text>
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 24, textAlign: 'center' }}>
              Your opponent did not respond in time. You can restart or quit.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity style={{ flex: 1, marginRight: 8, backgroundColor: '#4facfe', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={handleRestart}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Restart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, marginLeft: 8, backgroundColor: '#e94560', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={handleQuit}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Quit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  timerText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 10,
  },
}); 