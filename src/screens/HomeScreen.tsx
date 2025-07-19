import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

type ModeType = 'computer' | 'multiplayer' | 'bluetooth' | null;
type RoundMode = '3' | '5' | '9' | 'no-limit';

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>();
  const [selectedMode, setSelectedMode] = React.useState<ModeType>(null);
  const [roundModalVisible, setRoundModalVisible] = React.useState(false);
  const [selectedRound, setSelectedRound] = React.useState<RoundMode>('no-limit');
  const [pendingMode, setPendingMode] = React.useState<ModeType>(null);

  const isExpoGo = Constants.appOwnership === 'expo';

  const handleModeSelection = (mode: ModeType) => {
    setPendingMode(mode);
    setRoundModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleRoundConfirm = () => {
    setSelectedMode(pendingMode);
    setRoundModalVisible(false);
    setTimeout(() => {
      if (pendingMode === 'multiplayer') {
        navigation.navigate('Multiplayer', { roundMode: selectedRound });
      } else if (pendingMode === 'bluetooth') {
        navigation.navigate('BluetoothMultiplayer', { roundMode: selectedRound });
      } else if (pendingMode === 'computer') {
        navigation.navigate('Game', { mode: 'computer', roundMode: selectedRound });
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
          {!isExpoGo && (
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
          )}
          {isExpoGo && (
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
              Bluetooth multiplayer is only available in a custom build.
            </Text>
          )}
        </View>
      </View>
      <Modal
        visible={roundModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoundModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Rounds</Text>
            {['3', '5', '9', 'no-limit'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.roundOption, selectedRound === mode && styles.selectedRoundOption]}
                onPress={() => setSelectedRound(mode as RoundMode)}
              >
                <Text style={styles.roundOptionText}>
                  {mode === 'no-limit' ? 'No Limit' : `Best of ${mode}`}
                </Text>
                {selectedRound === mode && (
                  <Ionicons name="checkmark-circle" size={20} color="#43e97b" style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.confirmButton} onPress={handleRoundConfirm}>
              <Text style={styles.confirmButtonText}>Start Game</Text>
            </TouchableOpacity>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222a36',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: 300,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  roundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 6,
    width: '100%',
    justifyContent: 'space-between',
  },
  selectedRoundOption: {
    backgroundColor: 'rgba(67,233,123,0.18)',
    borderColor: '#43e97b',
    borderWidth: 1.5,
  },
  roundOptionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#43e97b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 24,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 