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

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;
type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

const { width, height } = Dimensions.get('window');

export default function GameScreen() {
  const navigation = useNavigation<GameScreenNavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  const { mode } = route.params;
  const roomId = mode === 'multiplayer' ? route.params.roomId : undefined;
  const playerNumber = mode === 'multiplayer' && 'playerNumber' in route.params ? route.params.playerNumber : null;
  
  const [gamePhase, setGamePhase] = useState<'waiting' | 'countdown' | 'playing' | 'result'>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<string | null>(null);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [scores, setScores] = useState({ wins: 0, losses: 0, ties: 0 });
  const [opponentMoved, setOpponentMoved] = useState(false);
  const [canPlayAgain, setCanPlayAgain] = useState(false);
  
  const countdownAnimation = useRef(new Animated.Value(1)).current;
  const choiceAnimation = useRef(new Animated.Value(0)).current;

  const socket = useSocket();

  useEffect(() => {
    if (mode === 'multiplayer' && roomId && socket) {
      console.log('[GameScreen] Connecting to multiplayer game, room:', roomId);
      socket.emit('join_room', roomId);

      const onConnect = () => {
        console.log('[GameScreen] Connected to server');
      };
      socket.on('connect', onConnect);

      const onGameStart = () => {
        console.log('[GameScreen] Game started!');
        setGamePhase('countdown');
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
        // Reset for next round after 3 seconds
        setTimeout(() => {
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
        // Remove listeners only
        socket.off('round_result', onRoundResult);
        socket.off('game_state', onGameState);
        socket.off('opponent_moved', onOpponentMoved);
        // Do NOT emit leave_room here; only do so in handleQuit
      };
    } else if (mode === 'computer') {
      // Single player mode - start immediately
      setGamePhase('countdown');
      startCountdown();
    }
  }, [mode, roomId, socket]);

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

  const handleChoice = (choice: string) => {
    if (gamePhase !== 'playing' || playerChoice || (mode === 'multiplayer' && !playerNumber)) return;
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
        // Update scores
        if (result === 'win') {
          setScores(prev => ({ ...prev, wins: prev.wins + 1 }));
        } else if (result === 'lose') {
          setScores(prev => ({ ...prev, losses: prev.losses + 1 }));
        } else {
          setScores(prev => ({ ...prev, ties: prev.ties + 1 }));
        }
        // Reset for next round after 3 seconds
        setTimeout(() => {
          setPlayerChoice(null);
          setOpponentChoice(null);
          setRoundResult(null);
          setOpponentMoved(false);
          setGamePhase('countdown');
          startCountdown();
        }, 3000);
      }, 500);
    }
  };

  const getResultText = () => {
    if (roundResult === 'tie') return "It's a tie!";
    if (roundResult === 'p1') return playerNumber === 1 ? "You win!" : "You lose!";
    if (roundResult === 'p2') return playerNumber === 2 ? "You win!" : "You lose!";
    return '';
  };

  const getResultColor = () => {
    if (roundResult === 'tie') return '#888'; // gray
    if (roundResult === 'p1') return playerNumber === 1 ? '#28a745' : '#d9534f'; // green/red
    if (roundResult === 'p2') return playerNumber === 2 ? '#28a745' : '#d9534f'; // green/red
    return '#fff';
  };

  const getResultIcon = () => {
    if (roundResult === 'tie') return '🤝';
    if (roundResult === 'p1') return playerNumber === 1 ? '🏆' : '😞';
    if (roundResult === 'p2') return playerNumber === 2 ? '🏆' : '😞';
    return '';
  };

  const handlePlayAgain = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setRoundResult(null);
    setGamePhase('playing');
    setCanPlayAgain(false);
  };

  const handleQuit = () => {
    if (mode === 'multiplayer' && roomId && socket) {
      socket.emit('leave_room', roomId);
    }
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
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
            <Animated.Text
              style={[
                styles.countdownText,
                {
                  opacity: countdownAnimation,
                  transform: [{ scale: countdownAnimation }],
                },
              ]}
            >
              {countdown}
            </Animated.Text>
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
            <View style={{
              backgroundColor: '#222a36',
              borderRadius: 16,
              padding: 32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6,
              alignItems: 'center',
              marginBottom: 24,
              minWidth: 220,
            }}>
              <Text style={{ fontSize: 48, marginBottom: 8, textAlign: 'center' }}>
                {getResultIcon()}
              </Text>
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                marginBottom: 8,
                color: getResultColor(),
                textAlign: 'center',
              }}>
                {getResultText()}
              </Text>
            </View>
            <Button title="Play Again" onPress={handlePlayAgain} disabled={!canPlayAgain} />
            <View style={{ height: 12 }} />
            <Button title="Quit" onPress={handleQuit} color="#d9534f" />
          </View>
        )}
      </View>
    </LinearGradient>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
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
    fontSize: 18,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 20,
  },
     resultText: {
     fontSize: 24,
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
     fontSize: 16,
     fontWeight: 'bold',
     color: '#fff',
     marginBottom: 10,
   },
   choiceEmoji: {
     fontSize: 40,
   },
 }); 