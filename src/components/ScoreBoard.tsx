import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ScoreBoardProps {
  scores: {
    wins: number;
    losses: number;
    ties: number;
  };
}

export default function ScoreBoard({ scores }: ScoreBoardProps) {
  const totalGames = scores.wins + scores.losses + scores.ties;
  const winPercentage = totalGames > 0 ? Math.round((scores.wins / totalGames) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.scoreRow}>
        <View style={styles.scoreItem}>
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            style={styles.scoreGradient}
          >
            <Text style={styles.scoreNumber}>{scores.wins}</Text>
            <Text style={styles.scoreLabel}>WINS</Text>
          </LinearGradient>
        </View>

        <View style={styles.scoreItem}>
          <LinearGradient
            colors={['#fa709a', '#fee140']}
            style={styles.scoreGradient}
          >
            <Text style={styles.scoreNumber}>{scores.losses}</Text>
            <Text style={styles.scoreLabel}>LOSSES</Text>
          </LinearGradient>
        </View>

        <View style={styles.scoreItem}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.scoreGradient}
          >
            <Text style={styles.scoreNumber}>{scores.ties}</Text>
            <Text style={styles.scoreLabel}>TIES</Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.totalGames}>Total Games: {totalGames}</Text>
        <Text style={styles.winRate}>Win Rate: {winPercentage}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  scoreItem: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  scoreGradient: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  totalGames: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  winRate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
}); 