import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type Choice = 'rock' | 'paper' | 'scissors';

interface ChoiceButtonProps {
  choice: Choice;
  onPress: () => void;
  disabled?: boolean;
}

const getChoiceColor = (choice: Choice): [string, string] => {
  switch (choice) {
    case 'rock': return ['#8B4513', '#A0522D'];
    case 'paper': return ['#4169E1', '#6495ED'];
    case 'scissors': return ['#32CD32', '#90EE90'];
    default: return ['#888', '#bbb'];
  }
};

const getChoiceEmoji = (choice: Choice): string => {
  switch (choice) {
    case 'rock': return '✊';
    case 'paper': return '✋';
    case 'scissors': return '✌';
  }
};

export default function ChoiceButton({ choice, onPress, disabled = false }: ChoiceButtonProps) {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const rotationAnimation = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (disabled) return;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onPress();
  };

  const spin = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.button,
          {
            transform: [
              { scale: scaleAnimation },
              { rotate: spin },
            ],
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <LinearGradient
          colors={getChoiceColor(choice)}
          style={styles.gradient}
        >
          <Text style={styles.emoji}>{getChoiceEmoji(choice)}</Text>
          <Text style={styles.label}>{choice.toUpperCase()}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    flex: 1,
    borderRadius: (width * 0.25) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 