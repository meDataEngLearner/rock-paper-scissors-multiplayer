import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Button,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { useSocket } from '../utils/SocketContext';
import GameCard from '../components/GameCard';
import ChoiceButton from '../components/ChoiceButton';
import ScoreBoard from '../components/ScoreBoard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getResponsiveFontSize } from '../utils/responsive';
// Remove import { getRandomHandImage } from '../utils/handImages';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;
type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

const { width, height } = Dimensions.get('window');

export default function GameScreen() {
  const navigation = useNavigation<GameScreenNavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  const { mode } = route.params;
  const roomId = mode === 'multiplayer' ? route.params.roomId : undefined;
  const playerNumber = mode === 'multiplayer' && 'playerNumber' in route.params ? route.params.playerNumber : null;
  
  if (mode === 'multiplayer' && (!playerNumber || playerNumber < 1)) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <Text style={{ color: '#fff', fontSize: 20 }}>Error: Player number not set. Please rejoin the room.</Text>
      </SafeAreaView>
    );
  }

  const [gamePhase, setGamePhase] = useState<'waiting' | 'countdown' | 'playing' | 'result' | 'opponent_left'>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<string | null>(null);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [scores, setScores] = useState({ wins: 0, losses: 0, ties: 0 });
  const [opponentMoved, setOpponentMoved] = useState(false);
  const [canPlayAgain, setCanPlayAgain] = useState(false);
  const [showOpponentLeftModal, setShowOpponentLeftModal] = useState(false);
  const [gameHasStarted, setGameHasStarted] = useState(false);
  const [opponentLeftCountdown, setOpponentLeftCountdown] = useState<number | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const resultPopupAnim = useRef(new Animated.Value(0)).current;
  
  const countdownAnimation = useRef(new Animated.Value(1)).current;
  const choiceAnimation = useRef(new Animated.Value(0)).current;
  const autoRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const socket = useSocket();

  useEffect(() => {
    if (mode === 'multiplayer' && roomId && socket) {
      console.log('[GameScreen] Connecting to multiplayer game, room:', roomId);
      // DO NOT emit join_room here; player is already in the room from RoomScreen
      // socket.emit('join_room', roomId);

      const onConnect = () => {
        console.log('[GameScreen] Connected to server');
      };
      socket.on('connect', onConnect);

      const onGameStart = () => {
        if (gameHasStarted) return; // Prevent multiple triggers
        console.log('[GameScreen] Game started!');
        setGamePhase('countdown');
        setShowOpponentLeftModal(false);
        setGameHasStarted(true);
        startCountdown();
      };
      socket.on('game_start', onGameStart);

      const onOpponentMoved = () => {
        console.log('[GameScreen] Opponent made a move');
        setOpponentMoved(true);
      };
      socket.on('opponent_moved', onOpponentMoved);

      const onRoundResult = (data: any) => {
        console.log('[GameScreen] My player number:', playerNumber);
        console.log('[GameScreen] Received round_result:', data);
        if (playerNumber) {
          setPlayerChoice(data.moves[playerNumber]);
          setOpponentChoice(data.moves[playerNumber === 1 ? 2 : 1]);
        }
        setRoundResult(data.result);
        setGamePhase('result');
        setCanPlayAgain(true);
        // Show animated result pop-up
        setShowResultPopup(true);
        resultPopupAnim.setValue(0);
        Animated.timing(resultPopupAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        setTimeout(() => {
          setShowResultPopup(false);
        }, 1000);
        // Update scores
        if (data.result === 'p1' && playerNumber === 1) {
          setScores(prev => ({ ...prev, wins: prev.wins + 1 }));
        } else if (data.result === 'p2' && playerNumber === 2) {
          setScores(prev => ({ ...prev, wins: prev.wins + 1 }));
        } else if (data.result === 'p1' || data.result === 'p2') {
          setScores(prev => ({ ...prev, losses: prev.losses + 1 }));
        } else if (data.result === 'tie') {
          setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
        }
        // Reset for next round after 3 seconds - store timeout in ref
        autoRestartTimeoutRef.current = setTimeout(() => {
          setPlayerChoice(null);
          setOpponentChoice(null);
          setRoundResult(null);
          setOpponentMoved(false);
          setGamePhase('countdown');
          startCountdown();
        }, 3000);
      };
      socket.on('round_result', onRoundResult);

      const onDisconnect = (reason: string) => {
        console.log('[GameScreen] Disconnected:', reason);
      };
      socket.on('disconnect', onDisconnect);

      const onReconnect = (attemptNumber: number) => {
        console.log('[GameScreen] Reconnected after', attemptNumber, 'attempts');
        socket.emit('join_room', roomId);
      };
      socket.on('reconnect', onReconnect);

      const onReconnectError = (error: any) => {
        console.log('[GameScreen] Reconnection error:', error);
      };
      socket.on('reconnect_error', onReconnectError);

      const onReconnectFailed = () => {
        console.log('[GameScreen] Reconnection failed');
        Alert.alert('Connection Lost', 'Unable to reconnect to the server. Please try again.');
      };
      socket.on('reconnect_failed', onReconnectFailed);

      const onOpponentLeft = () => {
        setShowOpponentLeftModal(true);
        setGamePhase('opponent_left');
        setOpponentLeftCountdown(3);
      };
      socket.on('opponent_left', onOpponentLeft);

      // Request game state on mount
      socket.emit('get_game_state', roomId);

      const onGameState = (data: { started: boolean }) => {
        if (data.started) {
          setGamePhase('countdown');
          startCountdown();
        }
      };
      socket.on('game_state', onGameState);

      // Only clean up listeners on unmount, do not emit leave_room automatically
      return () => {
        // Clear any pending automatic restart
        if (autoRestartTimeoutRef.current) {
          clearTimeout(autoRestartTimeoutRef.current);
          autoRestartTimeoutRef.current = null;
        }
        // Remove listeners only
        socket.off('round_result', onRoundResult);
        socket.off('game_state', onGameState);
        socket.off('opponent_moved', onOpponentMoved);
        socket.off('opponent_left', onOpponentLeft);
        // Do NOT emit leave_room here; only do so in handleQuit
        socket.off('game_start', onGameStart);
      };
    } else if (mode === 'computer') {
      // Single player mode - start immediately
      startSinglePlayerRound();
    }
  }, [mode, roomId, socket]);

  // Robust countdown effect for opponent left
  useEffect(() => {
    if (showOpponentLeftModal && typeof opponentLeftCountdown === 'number') {
      if (opponentLeftCountdown === 0) {
        setShowOpponentLeftModal(false);
        setOpponentLeftCountdown(null);
        setGamePhase('waiting');
        setPlayerChoice(null);
        setOpponentChoice(null);
        setRoundResult(null);
        setOpponentMoved(false);
        setCanPlayAgain(false);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        return;
      }
      const timer = setTimeout(() => {
        setOpponentLeftCountdown((prev) => (typeof prev === 'number' ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showOpponentLeftModal, opponentLeftCountdown, navigation]);

  const startCountdown = () => {
    setCountdown(3);
    countdownAnimation.setValue(1);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setGamePhase('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    Animated.sequence([
      Animated.timing(countdownAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Helper to start a new round in single player mode
  const startSinglePlayerRound = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setRoundResult(null);
    setCanPlayAgain(false);
    setGamePhase('countdown');
    setCountdown(3);
    countdownAnimation.setValue(1);
    let count = 3;
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        setGamePhase('playing');
      }
    }, 1000);
    Animated.sequence([
      Animated.timing(countdownAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleChoice = (choice: string) => {
    if (gamePhase !== 'playing' || playerChoice) return;
    if (mode === 'multiplayer' && (!playerNumber || playerNumber < 1)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlayerChoice(choice);
    Animated.timing(choiceAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    if (mode === 'multiplayer' && socket) {
      console.log('[GameScreen] Making move:', choice, 'playerNumber:', playerNumber);
      socket.emit('make_move', { roomId, move: choice, playerNumber });
    } else {
      // Single player mode
      setTimeout(() => {
        const choices = ['rock', 'paper', 'scissors'];
        const computerChoice = choices[Math.floor(Math.random() * 3)];
        setOpponentChoice(computerChoice);
        // Determine result
        let result = 'tie';
        if (choice !== computerChoice) {
          if ((choice === 'rock' && computerChoice === 'scissors') ||
              (choice === 'paper' && computerChoice === 'rock') ||
              (choice === 'scissors' && computerChoice === 'paper')) {
            result = 'win';
          } else {
            result = 'lose';
          }
        }
        setRoundResult(result);
        setGamePhase('result');
        setShowResultPopup(true);
        resultPopupAnim.setValue(0);
        Animated.timing(resultPopupAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        setTimeout(() => {
          setShowResultPopup(false);
        }, 1000);
        // Update scores
        if (result === 'win') {
          setScores(prev => ({ ...prev, wins: prev.wins + 1 }));
        } else if (result === 'lose') {
          setScores(prev => ({ ...prev, losses: prev.losses + 1 }));
        } else {
          setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
        }
        // Auto restart for single player - store timeout in ref
        autoRestartTimeoutRef.current = setTimeout(() => {
          startSinglePlayerRound();
        }, 2000);
      }, 500);
    }
  };

  const getResultText = () => {
    if (mode === 'computer') {
      if (roundResult === 'win') return "You win!";
      if (roundResult === 'lose') return "You lose!";
      if (roundResult === 'tie') return "It's a tie!";
    } else {
      if (roundResult === 'tie') return "It's a tie!";
      if (roundResult === 'p1') return playerNumber === 1 ? "You win!" : "You lose!";
      if (roundResult === 'p2') return playerNumber === 2 ? "You win!" : "You lose!";
    }
    return '';
  };

  const getResultColor = () => {
    if (mode === 'computer') {
      if (roundResult === 'win') return '#28a745'; // green
      if (roundResult === 'lose') return '#d9534f'; // red
      if (roundResult === 'tie') return '#888'; // gray
    } else {
      if (roundResult === 'tie') return '#888';
      if (roundResult === 'p1') return playerNumber === 1 ? '#28a745' : '#d9534f';
      if (roundResult === 'p2') return playerNumber === 2 ? '#28a745' : '#d9534f';
    }
    return '#fff';
  };

  const getResultIcon = () => {
    if (mode === 'computer') {
      if (roundResult === 'win') return '🏆';
      if (roundResult === 'lose') return '😞';
      if (roundResult === 'tie') return '🤝';
    } else {
      if (roundResult === 'tie') return '🤝';
      if (roundResult === 'p1') return playerNumber === 1 ? '🏆' : '😞';
      if (roundResult === 'p2') return playerNumber === 2 ? '🏆' : '😞';
    }
    return '';
  };

  const handlePlayAgain = () => {
    // Cancel any pending automatic round restart
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current);
      autoRestartTimeoutRef.current = null;
    }
    
    // Reset game state
    setPlayerChoice(null);
    setOpponentChoice(null);
    setRoundResult(null);
    setOpponentMoved(false);
    setCanPlayAgain(false);
    
    // Start new round with proper countdown for both modes
    if (mode === 'multiplayer') {
      // For multiplayer, go to countdown phase
      setGamePhase('countdown');
      startCountdown();
    } else {
      // For single player, use the existing single player round function
      startSinglePlayerRound();
    }
  };

  const handleQuit = () => {
    if (mode === 'multiplayer' && roomId && socket) {
      socket.emit('leave_room', roomId);
    }
    navigation.goBack();
  };

  const handleOpponentLeftAcknowledge = () => {
    setShowOpponentLeftModal(false);
    if (mode === 'multiplayer' && roomId && socket) {
      socket.emit('leave_room', roomId);
    }
    // Reset all game state
    setGamePhase('waiting');
    setPlayerChoice(null);
    setOpponentChoice(null);
    setRoundResult(null);
    setOpponentMoved(false);
    setCanPlayAgain(false);
    navigation.goBack();
  };

  const getChoiceEmoji = (choice: string): string => {
    switch (choice) {
      case 'rock': return '✊';
      case 'paper': return '✋';
      case 'scissors': return '✌';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a2e' }}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            
            <Text style={styles.title}>
              {mode === 'multiplayer' ? 'Multiplayer' : 'Single Player'}
            </Text>
            
            <View style={styles.placeholder} />
          </View>

          <ScoreBoard scores={scores} />

          <View style={styles.gameArea}>
            {gamePhase === 'waiting' && (
              <View style={styles.waitingContainer}>
                <View style={styles.loadingDots}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
                <Text style={styles.waitingText}>Waiting for game to start...</Text>
              </View>
            )}

            {gamePhase === 'countdown' && (
              <View style={styles.countdownContainer}>
                <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <ActivityIndicator size="large" color="#222" />
                </View>
                <Text style={{ fontSize: 20, color: '#888', marginTop: 8 }}>Get Ready!</Text>
              </View>
            )}

            {gamePhase === 'playing' && (
              <View style={styles.playingContainer}>
                <View style={styles.choicesContainer}>
                  <ChoiceButton
                    choice="rock"
                    onPress={() => handleChoice('rock')}
                    disabled={!!playerChoice}
                  />
                  <ChoiceButton
                    choice="paper"
                    onPress={() => handleChoice('paper')}
                    disabled={!!playerChoice}
                  />
                  <ChoiceButton
                    choice="scissors"
                    onPress={() => handleChoice('scissors')}
                    disabled={!!playerChoice}
                  />
                </View>
                
                {playerChoice && (
                  <View style={styles.waitingForOpponent}>
                    <Text style={styles.waitingText}>Waiting for opponent...</Text>
                    {opponentMoved && (
                      <Text style={styles.opponentMovedText}>Opponent made their choice!</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {gamePhase === 'result' && (
              <View style={{ alignItems: 'center', marginTop: 32 }}>
                {(playerChoice && opponentChoice) ? (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
                      {/* Player Choice Card */}
                      <View style={{ alignItems: 'center', marginHorizontal: 12 }}>
                        <Text style={{ color: '#fff', fontSize: getResponsiveFontSize(16), marginBottom: 4 }}>You</Text>
                        <View style={{ backgroundColor: '#222a36', borderRadius: 16, padding: 24, minWidth: width * 0.4, alignItems: 'center' }}>
                          <Text style={{ fontSize: getResponsiveFontSize(36) }}>
                            {getChoiceEmoji(playerChoice)}
                          </Text>
                          <Text style={{ color: '#fff', fontSize: getResponsiveFontSize(16), marginTop: 8, textTransform: 'capitalize' }}>{playerChoice || ''}</Text>
                        </View>
                      </View>
                      {/* VS */}
                      <Text style={{ color: '#fff', fontSize: getResponsiveFontSize(24), fontWeight: 'bold', marginHorizontal: 8 }}>VS</Text>
                      {/* Opponent/Computer Choice Card */}
                      <View style={{ alignItems: 'center', marginHorizontal: 12 }}>
                        <Text style={{ color: '#fff', fontSize: getResponsiveFontSize(16), marginBottom: 4 }}>{mode === 'computer' ? 'Computer' : 'Opponent'}</Text>
                        <View style={{ backgroundColor: '#222a36', borderRadius: 16, padding: 24, minWidth: width * 0.4, alignItems: 'center' }}>
                          <Text style={{ fontSize: getResponsiveFontSize(36) }}>
                            {getChoiceEmoji(opponentChoice)}
                          </Text>
                          <Text style={{ color: '#fff', fontSize: getResponsiveFontSize(16), marginTop: 8, textTransform: 'capitalize' }}>{opponentChoice || ''}</Text>
                        </View>
                      </View>
                    </View>
                    {/* Result Card */}
                    <Animated.View style={{
                      backgroundColor: '#222a36',
                      borderRadius: 16,
                      padding: 24,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 6,
                      alignItems: 'center',
                      minWidth: width * 0.4,
                      marginBottom: 16,
                      opacity: resultPopupAnim,
                      transform: [{ scale: resultPopupAnim }],
                    }}>
                      <Text style={{ fontSize: getResponsiveFontSize(48), marginBottom: 8, textAlign: 'center' }}>
                        {getResultIcon()}
                      </Text>
                      <Text style={{
                        fontSize: getResponsiveFontSize(28),
                        fontWeight: 'bold',
                        marginBottom: 8,
                        color: getResultColor(),
                        textAlign: 'center',
                      }}>
                        {getResultText()}
                      </Text>
                    </Animated.View>
                  </>
                ) : (
                  <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
                    <Text style={{ color: '#fff', fontSize: getResponsiveFontSize(20), marginBottom: 12 }}>Waiting for result...</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#4facfe', margin: 4, opacity: 0.7 }} />
                      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#4facfe', margin: 4, opacity: 0.5 }} />
                      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#4facfe', margin: 4, opacity: 0.3 }} />
                    </View>
                  </View>
                )}
                {showResultPopup && (
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                  }}>
                    <Animated.View style={{
                      backgroundColor: '#fff',
                      borderRadius: 24,
                      padding: 32,
                      alignItems: 'center',
                      opacity: resultPopupAnim,
                      transform: [{ scale: resultPopupAnim }],
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 8,
                    }}>
                      <Text style={{ fontSize: getResponsiveFontSize(56), marginBottom: 8 }}>{getResultIcon()}</Text>
                      <Text style={{ fontSize: getResponsiveFontSize(28), fontWeight: 'bold', color: getResultColor(), textAlign: 'center' }}>{getResultText()}</Text>
                    </Animated.View>
                  </View>
                )}
                {/* Only show Play Again/Quit when not showing popup */}
                {!showResultPopup && canPlayAgain && (
                  <>
                    <Button title="Play Again" onPress={handlePlayAgain} />
                    <View style={{ height: 12 }} />
                    <Button title="Quit" onPress={handleQuit} color="#d9534f" />
                  </>
                )}
              </View>
            )}

            {gamePhase === 'opponent_left' && showOpponentLeftModal && (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                <View style={{ backgroundColor: '#222', borderRadius: 16, padding: 32, alignItems: 'center', width: '80%' }}>
                  <Text style={{ fontSize: getResponsiveFontSize(48), marginBottom: 12 }}>😞</Text>
                  <Text style={{ color: '#fff', fontSize: getResponsiveFontSize(22), fontWeight: 'bold', marginBottom: 12 }}>Opponent Left</Text>
                  <Text style={{ color: '#fff', fontSize: getResponsiveFontSize(16), marginBottom: 24, textAlign: 'center' }}>
                    Your opponent has left the game. The game is over.
                  </Text>
                  <TouchableOpacity style={{ backgroundColor: '#4facfe', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 }} onPress={handleOpponentLeftAcknowledge}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: getResponsiveFontSize(18) }}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
      {showOpponentLeftModal && (
        <Modal
          visible={showOpponentLeftModal}
          transparent
          animationType="fade"
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: 300 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#222' }}>Opponent Left</Text>
              <Text style={{ fontSize: 16, marginBottom: 24, color: '#444', textAlign: 'center' }}>
                Your opponent left the room. You no longer have an opponent.
              </Text>
              <View style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 16 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#764ba2' }}>
                    {opponentLeftCountdown ?? 3}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, color: '#888' }}>Returning to Home...</Text>
              </View>
              <TouchableOpacity style={{ marginTop: 12, backgroundColor: '#4facfe', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }} onPress={() => {
                setShowOpponentLeftModal(false);
                setOpponentLeftCountdown(null);
                setGamePhase('waiting');
                setPlayerChoice(null);
                setOpponentChoice(null);
                setRoundResult(null);
                setOpponentMoved(false);
                setCanPlayAgain(false);
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 2,
  },
  waitingText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  waitingForOpponent: {
    marginTop: 20,
    alignItems: 'center',
  },
  opponentMovedText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#fff',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  vsText: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 20,
  },
     resultText: {
     fontSize: getResponsiveFontSize(24),
     fontWeight: 'bold',
     color: '#fff',
     marginTop: 20,
   },
   choiceCard: {
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     borderRadius: 15,
     padding: 20,
     alignItems: 'center',
     minWidth: 100,
   },
   choiceTitle: {
     fontSize: getResponsiveFontSize(16),
     fontWeight: 'bold',
     color: '#fff',
     marginBottom: 10,
   },
   choiceEmoji: {
     fontSize: getResponsiveFontSize(40),
   },
 }); 