import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import GameCard from '../components/GameCard';
import ChoiceButton from '../components/ChoiceButton';
import ScoreBoard from '../components/ScoreBoard';
import io, { Socket } from 'socket.io-client';
import { getSocketServerUrl } from '../utils/socketUrl';

type GameScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Game'>;
type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;

type GameScreenParams =
  | { mode: 'computer' }
  | { mode: 'multiplayer'; roomId: string };

const { width, height } = Dimensions.get('window');

type Choice = 'rock' | 'paper' | 'scissors' | null;
type GameResult = 'win' | 'lose' | 'tie' | null;

const SOCKET_SERVER_URL = getSocketServerUrl();

export default function GameScreen() {
  const navigation = useNavigation<GameScreenNavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  const params = route.params as GameScreenParams;
  const mode = params.mode;
  const roomId = mode === 'multiplayer' ? params.roomId : undefined;

  const [playerChoice, setPlayerChoice] = useState<Choice>(null);
  const [computerChoice, setComputerChoice] = useState<Choice>(null);
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [isCountdown, setIsCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [scores, setScores] = useState({ wins: 0, losses: 0, ties: 0 });
  const [gamePhase, setGamePhase] = useState<'waiting' | 'countdown' | 'playing' | 'result'>('waiting');

  const countdownAnimation = useRef(new Animated.Value(1)).current;
  const cardAnimation = useRef(new Animated.Value(0)).current;

  // Multiplayer state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [opponentMove, setOpponentMove] = useState<Choice | null>(null);
  const [isMoveSent, setIsMoveSent] = useState(false);

  useEffect(() => {
    if (mode === 'computer') {
      startNewRound();
    }
    if (mode === 'multiplayer' && roomId) {
      const s = io(SOCKET_SERVER_URL);
      setSocket(s);
      s.emit('join_room', roomId);
      s.on('round_result', ({ moves, result: serverResult }) => {
        // Find which move is ours and which is opponent's
        const myId = s.id;
        const oppId = Object.keys(moves).find((id) => id !== myId);
        if (!myId || !oppId) return;
        setPlayerChoice(moves[myId]);
        setOpponentMove(moves[oppId]);
        let localResult: GameResult = 'tie';
        if (serverResult !== 'tie') {
          if ((serverResult === 'p1' && myId === Object.keys(moves)[0]) || (serverResult === 'p2' && myId === Object.keys(moves)[1])) {
            localResult = 'win';
          } else {
            localResult = 'lose';
          }
        }
        setGameResult(localResult);
        setGamePhase('result');
        setIsMoveSent(false);
        setScores(prev => ({
          ...prev,
          [localResult === 'win' ? 'wins' : localResult === 'lose' ? 'losses' : 'ties']: prev[localResult === 'win' ? 'wins' : localResult === 'lose' ? 'losses' : 'ties'] + 1
        }));
        if (localResult === 'win') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (localResult === 'lose') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      });
      return () => {
        s.disconnect();
      };
    }
  }, [mode, roomId]);

  useEffect(() => {
    if (isCountdown) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsCountdown(false);
            setGamePhase('playing');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return 3;
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isCountdown]);

  useEffect(() => {
    if (gamePhase === 'result') {
      Animated.spring(cardAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [gamePhase]);

  const startNewRound = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setGameResult(null);
    setGamePhase('waiting');
    cardAnimation.setValue(0);
    
    setTimeout(() => {
      setIsCountdown(true);
      setGamePhase('countdown');
    }, 1000);
  };

  const makeComputerChoice = (): Choice => {
    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const determineWinner = (player: Choice, computer: Choice): GameResult => {
    if (!player || !computer) return null;
    
    if (player === computer) return 'tie';
    
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'win';
    }
    
    return 'lose';
  };

  const handleChoice = (choice: Choice) => {
    if (gamePhase !== 'playing') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === 'computer') {
      setPlayerChoice(choice);
      const computer = makeComputerChoice();
      setComputerChoice(computer);
      const result = determineWinner(choice, computer);
      setGameResult(result);
      setGamePhase('result');
      setScores(prev => ({
        ...prev,
        [result === 'win' ? 'wins' : result === 'lose' ? 'losses' : 'ties']: prev[result === 'win' ? 'wins' : result === 'lose' ? 'losses' : 'ties'] + 1
      }));
      if (result === 'win') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result === 'lose') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else if (mode === 'multiplayer' && socket && roomId) {
      setPlayerChoice(choice);
      setIsMoveSent(true);
      socket.emit('make_move', { roomId, move: choice });
      setWaitingForOpponent(true);
    }
  };

  const handlePlayAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startNewRound();
  };

  const handleBackToMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <View style={styles.header}>
        <ScoreBoard scores={scores} />
      </View>

      <View style={styles.gameArea}>
        <GameCard
          playerChoice={playerChoice}
          computerChoice={mode === 'computer' ? computerChoice : opponentMove}
          gameResult={gameResult}
          isCountdown={isCountdown}
          countdown={countdown}
          animation={cardAnimation}
        />
      </View>

      <View style={styles.controls}>
        {gamePhase === 'playing' && (
          <View style={styles.choiceButtons}>
            <ChoiceButton
              choice="rock"
              onPress={() => handleChoice('rock')}
              disabled={isMoveSent}
            />
            <ChoiceButton
              choice="paper"
              onPress={() => handleChoice('paper')}
              disabled={isMoveSent}
            />
            <ChoiceButton
              choice="scissors"
              onPress={() => handleChoice('scissors')}
              disabled={isMoveSent}
            />
          </View>
        )}

        {mode === 'multiplayer' && waitingForOpponent && (
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>Waiting for opponent's move...</Text>
        )}

        {gamePhase === 'result' && (
          <View style={styles.resultButtons}>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={handlePlayAgain}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Play Again</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleBackToMenu}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Menu</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controls: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  choiceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  resultButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 15,
  },
  playAgainButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuButton: {
    flex: 1,
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
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 