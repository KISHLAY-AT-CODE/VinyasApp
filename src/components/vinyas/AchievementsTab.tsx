import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions
} from 'react-native';
import { Award } from 'lucide-react-native';
import { THEME } from '../../constants/vinyas-theme';

const { width } = Dimensions.get('window');

interface Achievement {
  title: string;
  description: string;
  unlocked: boolean;
}

interface AchievementsTabProps {
  achievements: Achievement[];
}

export default function AchievementsTab({ achievements }: AchievementsTabProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length || 10;

  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Award size={18} color={THEME.orange} />
          <Text style={styles.cardTitle}>Vinyas Gamified Badges</Text>
          <Text style={styles.cardCount}>
            {unlockedCount}/{totalCount}
          </Text>
        </View>
        <Text style={styles.cardDesc}>
          Earn badges by hitting daily streaks, revising chapters, and solving problem sets.
        </Text>
      </View>

      {/* Achievements Grid */}
      {achievements.length === 0 ? (
        <Text style={styles.emptyText}>Sync profile to check unlocked achievements.</Text>
      ) : (
        <View style={styles.badgesGrid}>
          {achievements.map((badge, index) => {
            const isUnlocked = badge.unlocked;
            return (
              <View
                key={index}
                style={[
                  styles.badgeCard,
                  isUnlocked ? styles.badgeCardUnlocked : styles.badgeCardLocked
                ]}
              >
                {isUnlocked ? (
                  <View style={styles.badgeIconUnlocked}>
                    <Award size={24} color={THEME.orange} />
                  </View>
                ) : (
                  <View style={styles.badgeIconLocked}>
                    <Award size={24} color={THEME.borderLight} />
                  </View>
                )}
                <Text
                  style={[styles.badgeName, !isUnlocked && { color: THEME.textMuted }]}
                  numberOfLines={1}
                >
                  {badge.title}
                </Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>
                  {badge.description}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    padding: 0,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 18,
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 8,
    flex: 1,
  },
  cardCount: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#020617',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardDesc: {
    color: THEME.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  emptyText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  badgeCard: {
    width: (width - 44) / 2, // 2 items per row
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  badgeCardUnlocked: {
    backgroundColor: THEME.card,
    borderColor: THEME.orange + '40',
  },
  badgeCardLocked: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderColor: THEME.border,
  },
  badgeIconUnlocked: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: THEME.orange + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeIconLocked: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeName: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  badgeDesc: {
    color: THEME.textMuted,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
});
