import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type Choice = 'rock' | 'paper' | 'scissors' | null;
type GameResult = 'win' | 'lose' | 'tie' | null;

interface GameCardProps {
  playerChoice: Choice;
  computerChoice: Choice;
  gameResult: GameResult;
  isCountdown: boolean;
  countdown: number;
  animation: Animated.Value;
}

const getChoiceEmoji = (choice: Choice): string => {
  switch (choice) {
    case 'rock': return '🪨';
    case 'paper': return '📄';
    case 'scissors': return '✂️';
    default: return '❓';
  }
};

const getResultText = (result: GameResult): string => {
  switch (result) {
    case 'win': return 'You Win! 🎉';
    case 'lose': return 'You Lose 😔';
    case 'tie': return 'It\'s a Tie! 🤝';
    default: return '';
  }
};

const getResultColor = (result: GameResult): string[] => {
  switch (result) {
    case 'win': return ['#4facfe', '#00f2fe'];
    case 'lose': return ['#fa709a', '#fee140'];
    case 'tie': return ['#667eea', '#764ba2'];
    default: return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
  }
};

export default function GameCard({
  playerChoice,
  computerChoice,
  gameResult,
  isCountdown,
  countdown,
  animation,
}: GameCardProps) {
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCountdown) {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [countdown]);

  useEffect(() => {
    if (gameResult) {
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [gameResult]);

  const renderContent = () => {
    if (isCountdown) {
      return (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{countdown}</Text>
          <Text style={styles.countdownLabel}>Get Ready!</Text>
        </View>
      );
    }

    if (gameResult) {
      return (
        <View style={styles.resultContainer}>
          <View style={styles.choicesRow}>
            <View style={styles.choiceContainer}>
              <Text style={styles.choiceLabel}>You</Text>
              <Text style={styles.choiceEmoji}>{getChoiceEmoji(playerChoice)}</Text>
            </View>
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.choiceContainer}>
              <Text style={styles.choiceLabel}>Computer</Text>
              <Text style={styles.choiceEmoji}>{getChoiceEmoji(computerChoice)}</Text>
            </View>
          </View>
          <Text style={styles.resultText}>{getResultText(gameResult)}</Text>
        </View>
      );
    }

    return (
      <View style={styles.waitingContainer}>
        <Text style={styles.waitingText}>Choose your weapon!</Text>
        <Text style={styles.waitingSubtext}>Rock, Paper, or Scissors</Text>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: Animated.multiply(scaleAnimation, pulseAnimation) },
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
          opacity: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
      ]}
    >
      <LinearGradient
        colors={gameResult ? getResultColor(gameResult) : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.card}
      >
        {renderContent()}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    maxWidth: 400,
  },
  card: {
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  countdownLabel: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
  },
  choicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  choiceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  choiceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  choiceEmoji: {
    fontSize: 48,
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
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  waitingContainer: {
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  waitingSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
}); 