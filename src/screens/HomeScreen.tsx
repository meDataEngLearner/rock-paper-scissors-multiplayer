import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  type ModeType = 'computer' | 'multiplayer' | 'bluetooth' | null;
  const [selectedMode, setSelectedMode] = React.useState<ModeType>(null);

  const handleModeSelection = (mode: 'computer' | 'multiplayer' | 'bluetooth') => {
    setSelectedMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      if (mode === 'multiplayer') {
        navigation.navigate('Multiplayer');
      } else if (mode === 'bluetooth') {
        navigation.navigate({ name: 'BluetoothMultiplayer' });
      } else {
        navigation.navigate('Game', { mode });
      }
    }, 200);
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Rock</Text>
          <Text style={styles.title}>Paper</Text>
          <Text style={styles.title}>Scissors</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'computer' && styles.selectedButton]}
            onPress={() => handleModeSelection('computer')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Play vs Computer</Text>
              <Text style={styles.buttonSubtext}>Challenge the AI</Text>
              {selectedMode === 'computer' && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginTop: 8 }} />
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'multiplayer' && styles.selectedButton]}
            onPress={() => handleModeSelection('multiplayer')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#fa709a', '#fee140']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Play with Friends (Multiplayer)</Text>
              <Text style={styles.buttonSubtext}>Real-time multiplayer</Text>
              {selectedMode === 'multiplayer' && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginTop: 8 }} />
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'bluetooth' && styles.selectedButton]}
            onPress={() => handleModeSelection('bluetooth')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Bluetooth Multiplayer</Text>
              <Text style={styles.buttonSubtext}>Offline play via Bluetooth</Text>
              {selectedMode === 'bluetooth' && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginTop: 8 }} />
              )}
            </LinearGradient>
          </TouchableOpacity>
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
  titleContainer: {
    marginBottom: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  modeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
}); 