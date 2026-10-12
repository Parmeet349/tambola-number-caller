// components/HostPartyModal.tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../utils/store/themeState';

export interface IncomingClaim {
  id: string;
  playerName: string;
  claimType: string;
  timestamp: number;
  status: 'pending' | 'verified' | 'bogey';
}

interface HostPartyModalProps {
  visible: boolean;
  onClose: () => void;
  roomCode: string;
  isBroadcasting: boolean;
  claims: IncomingClaim[];
  onToggleBroadcast: () => void;
  onUpdateClaimStatus: (claimId: string, status: 'verified' | 'bogey') => void;
  calledCount: number;
}

export default function HostPartyModal({
  visible,
  onClose,
  roomCode,
  isBroadcasting,
  claims,
  onToggleBroadcast,
  onUpdateClaimStatus,
  calledCount,
}: HostPartyModalProps) {
  const { currentTheme } = useTheme();

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join our Tambola Game Night!\n\nOpen the Tambola app, tap "Join Party" and enter Room Code: ${roomCode}\n\nNumbers will update live on your phone as they are called!`,
      });
    } catch (e) {
      console.warn('Share error', e);
    }
  };

  const handleVerify = (claim: IncomingClaim) => {
    onUpdateClaimStatus(claim.id, 'verified');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    Alert.alert('Claim Approved', `Awarded "${claim.claimType}" to ${claim.playerName}!`);
  };

  const handleBogey = (claim: IncomingClaim) => {
    onUpdateClaimStatus(claim.id, 'bogey');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {}
    Alert.alert('Bogey Declared', `${claim.playerName}'s claim was rejected as a Bogey.`);
  };

  const isDark = currentTheme.isDark;
  const darkBorder = currentTheme.id === 'midnight' ? '#1e293b' : '#2a1f49';
  const darkRowBorder = currentTheme.id === 'midnight' ? '#334155' : '#3d2e6b';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: currentTheme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? darkBorder : '#f0f0f0' }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, { color: currentTheme.primary }]}>Done</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Live Game Night</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* Room Code Card */}
          <View
            style={[
              styles.codeCard,
              {
                backgroundColor: currentTheme.cardBg,
                borderColor: isDark ? darkBorder : '#eee',
              },
            ]}
          >
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isBroadcasting ? '#4caf50' : '#ffa000' },
                ]}
              />
              <Text
                style={[
                  styles.statusLabel,
                  { color: isBroadcasting ? '#4caf50' : '#ffa000' },
                ]}
              >
                {isBroadcasting ? 'LIVE ON PLAYERS’ PHONES' : 'SHARING PAUSED'}
              </Text>
            </View>

            <Text style={[styles.codeTitle, { color: currentTheme.textLight }]}>
              ROOM CODE
            </Text>
            <Text style={[styles.roomCodeNumber, { color: currentTheme.primary }]}>
              {roomCode}
            </Text>

            <Text style={[styles.codeHelp, { color: currentTheme.textLight }]}>
              Guests enter this code in "Join Party" to see numbers live on their phones!
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.shareBtn, { backgroundColor: currentTheme.primary }]}
                onPress={handleShareInvite}
              >
                <MaterialIcons name="share" size={18} color="#fff" />
                <Text style={styles.shareBtnText}>Share Code with Guests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: isBroadcasting
                      ? currentTheme.isDark
                        ? '#3e1717'
                        : '#ffebee'
                      : currentTheme.isDark
                      ? '#14331e'
                      : '#e8f5e9',
                    borderColor: isBroadcasting ? '#ef5350' : '#4caf50',
                  },
                ]}
                onPress={onToggleBroadcast}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    {
                      color: isBroadcasting
                        ? currentTheme.isDark
                          ? '#f87171'
                          : '#d32f2f'
                        : currentTheme.isDark
                        ? '#4ade80'
                        : '#2e7d32',
                    },
                  ]}
                >
                  {isBroadcasting ? 'Pause Sharing' : 'Resume Sharing'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: currentTheme.cardBg, borderColor: isDark ? darkBorder : '#eee' }]}>
              <Text style={[styles.statNumber, { color: currentTheme.primary }]}>{calledCount}</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textLight }]}>Numbers Called</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: currentTheme.cardBg, borderColor: isDark ? darkBorder : '#eee' }]}>
              <Text style={[styles.statNumber, { color: '#e65100' }]}>{claims.length}</Text>
              <Text style={[styles.statLabel, { color: currentTheme.textLight }]}>Claims Received</Text>
            </View>
          </View>

          {/* Incoming Win Claims */}
          <View style={[styles.claimsCard, { backgroundColor: currentTheme.cardBg, borderColor: isDark ? darkBorder : '#eee' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Ionicons name="trophy-outline" size={18} color={currentTheme.primary} />
              <Text style={[styles.claimsTitle, { color: currentTheme.text, marginBottom: 0 }]}>
                Player Win Claims
              </Text>
            </View>

            {claims.length === 0 ? (
              <View style={styles.emptyClaims}>
                <Ionicons name="notifications-outline" size={32} color={currentTheme.textLight} />
                <Text style={[styles.emptyClaimsText, { color: currentTheme.textLight }]}>
                  No claims yet. When players call Early 5, Lines, or Full House on their phones, they will appear here instantly for you to verify!
                </Text>
              </View>
            ) : (
              claims.map((claim) => (
                <View
                  key={claim.id}
                  style={[
                    styles.claimRow,
                    {
                      borderColor: isDark ? darkRowBorder : '#eee',
                      backgroundColor:
                        claim.status === 'verified'
                          ? isDark
                            ? '#143820'
                            : '#e8f5e9'
                          : claim.status === 'bogey'
                          ? isDark
                            ? '#381616'
                            : '#ffebee'
                          : 'transparent',
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.claimPlayerName, { color: currentTheme.text }]}>
                      {claim.playerName}
                    </Text>
                    <Text style={[styles.claimTypeName, { color: currentTheme.primary }]}>
                      Claimed: {claim.claimType}
                    </Text>
                    <Text style={[styles.claimTime, { color: currentTheme.textLight }]}>
                      {new Date(claim.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>

                  {claim.status === 'pending' ? (
                    <View style={styles.claimActions}>
                      <TouchableOpacity
                        style={styles.verifyBtn}
                        onPress={() => handleVerify(claim)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
                        <Text style={styles.actionBtnText}>Verify</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bogeyBtn}
                        onPress={() => handleBogey(claim)}
                      >
                        <Ionicons name="close-circle-outline" size={15} color="#fff" />
                        <Text style={styles.actionBtnText}>Bogey</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.resolvedBadge, { backgroundColor: isDark ? (currentTheme.id === 'midnight' ? '#1e293b' : '#261c42') : '#fff' }]}>
                      <Text
                        style={{
                          fontWeight: '800',
                          fontSize: 12,
                          color: claim.status === 'verified' ? (isDark ? '#81c784' : '#2e7d32') : (isDark ? '#ef5350' : '#c62828'),
                        }}
                      >
                        {claim.status === 'verified' ? 'APPROVED' : 'BOGEY'}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 16, fontWeight: '700' },

  container: { padding: 16 },
  codeCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  codeTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  roomCodeNumber: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 6,
    marginVertical: 4,
  },
  codeHelp: { fontSize: 13, textAlign: 'center', marginBottom: 18, paddingHorizontal: 12 },
  btnRow: { flexDirection: 'row', gap: 10, width: '100%' },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  shareBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnText: { fontWeight: '800', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: { fontSize: 26, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  claimsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  claimsTitle: { fontSize: 17, fontWeight: '900', marginBottom: 12 },
  emptyClaims: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, gap: 8 },
  emptyClaimsText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  claimPlayerName: { fontSize: 15, fontWeight: '800' },
  claimTypeName: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  claimTime: { fontSize: 11, marginTop: 2 },
  claimActions: { flexDirection: 'row', gap: 6 },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2e7d32',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bogeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#c62828',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  resolvedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
});
