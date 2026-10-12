// components/screens/GameScreen.tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../app/(tabs)/index';
import { logEvent, logScreenView } from '../../utils/analytics';
import { useInterstitial } from '../ads/Interstitial';
import { useRewardedAd } from '../../utils/hooks/useRewardedAd';
import { useAdState } from '../../utils/store/adState';
import { useTheme } from '../../utils/store/themeState';
import { shouldShowInterstitial, recordInterstitialShown } from '../../utils/adFrequency';
import HostPartyModal, { IncomingClaim } from '../HostPartyModal';
import { broadcastPartyMessage, connectToPartyRoom, generateRoomCode } from '../../utils/partySync';
import NumberGrid from '../NumberGrid';
import { numberStyle } from '../../utils/numberStyle';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const STORAGE_KEY = '@tambola_state_v1';
const SPEEDS_MS = { slow: 3000, medium: 1500, fast: 700 } as const;
const isIOS = Platform.OS === 'ios';

const VOICE_OPTIONS = [
    { id: 'fun_english', label: 'Fun English' },
    { id: 'classic', label: 'Classic UK' },
    { id: 'desi_bingo', label: 'Desi Bingo' },
    { id: 'hindi_standard', label: 'Hindi Standard' },
] as const;

function createShuffledNumbers(): number[] {
    const arr = Array.from({ length: 90 }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default function GameScreen({ route, navigation }: Props) {
    const insets = useSafeAreaInsets();
    const topInset = Math.max(
        insets.top,
        Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
    );
    const bottomInset = Math.max(insets.bottom, 24);
    const { currentTheme } = useTheme();
    const {
        initialMode,
        initialSpeed,
        initialMute,
        hostName,
        partyRoomCode: initialPartyCode,
        isPartyHost: initialPartyHost,
        callerVoice: initialVoice,
        isNewGame,
    } = route.params ?? {};
    const [partyRoomCode, setPartyRoomCode] = useState<string>(() => initialPartyCode || generateRoomCode());
    const [isPartyHost, setIsPartyHost] = useState<boolean>(() => !!initialPartyHost);
    const [isBroadcasting, setIsBroadcasting] = useState<boolean>(() => !!initialPartyHost);
    const [partyModalVisible, setPartyModalVisible] = useState<boolean>(false);
    const [partyClaims, setPartyClaims] = useState<IncomingClaim[]>([]);
    const [latestClaimToast, setLatestClaimToast] = useState<string | null>(null);

    const [deck, setDeck] = useState<number[]>(() => createShuffledNumbers());
    const ptrRef = useRef<number>(0);
    const [calledSet, setCalledSet] = useState<Set<number>>(new Set());
    const [history, setHistory] = useState<number[]>([]);
    const [mode, setMode] = useState<'manual' | 'auto'>(initialMode ?? 'manual');
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>(initialSpeed ?? 'medium');
    const [mute, setMute] = useState<boolean>(!!initialMute);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [callerVoice, setCallerVoice] = useState<'classic' | 'fun_english' | 'hindi_standard' | 'desi_bingo'>(() => initialVoice || 'fun_english');
    const intervalRef = useRef<number | null>(null);
    const { loaded, show } = useInterstitial();
    const { showAds } = useAdState();
    const { loaded: rewardedLoaded, show: showRewarded } = useRewardedAd();

    const handleVoiceChange = async (v: 'classic' | 'fun_english' | 'hindi_standard' | 'desi_bingo') => {
        setCallerVoice(v);
        try {
            await AsyncStorage.setItem('@tambola_caller_voice', v);
        } catch (e) {}
    };

    const [optionsVisible, setOptionsVisible] = useState(false);

    const toastAnim = useRef(new Animated.Value(0)).current;

    const T = currentTheme;
    const isDark = T.isDark;

    useEffect(() => {
        if (!isPartyHost || !partyRoomCode) return;
        const conn = connectToPartyRoom(partyRoomCode, (msg) => {
            if (msg.type === 'CLAIM_WIN') {
                const newClaim: IncomingClaim = {
                    id: Math.random().toString(),
                    playerName: msg.playerName,
                    claimType: msg.claimType,
                    timestamp: msg.timestamp,
                    status: 'pending',
                };
                setPartyClaims((prev) => [newClaim, ...prev]);
                setLatestClaimToast(`${msg.playerName} claimed ${msg.claimType}!`);
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
            }
        });
        return () => conn.disconnect();
    }, [isPartyHost, partyRoomCode]);

    useEffect(() => {
        if (latestClaimToast) {
            Animated.sequence([
                Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.delay(3000),
                Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start(() => setLatestClaimToast(null));
        }
    }, [latestClaimToast]);

    useLayoutEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

    useEffect(() => {
        logScreenView('GameScreen');
        (async () => {
            if (!isNewGame) {
                const s = await AsyncStorage.getItem(STORAGE_KEY);
                if (s) {
                    const data = JSON.parse(s);
                    if (data) {
                        if (Array.isArray(data.deck)) setDeck(data.deck);
                        ptrRef.current = data.ptr ?? 0;
                        setCalledSet(new Set(data.called ?? []));
                        setHistory(data.history ?? []);
                        if (data.mode) setMode(data.mode);
                        if (data.speed) setSpeed(data.speed);
                        if (typeof data.mute === 'boolean') setMute(data.mute);
                        if (typeof data.isPlaying === 'boolean') setIsPlaying(data.isPlaying);
                        if (typeof data.elapsedSeconds === 'number') setElapsedSeconds(data.elapsedSeconds);
                        if (data.callerVoice) setCallerVoice(data.callerVoice);
                    }
                }
            }
            if (initialVoice) {
                setCallerVoice(initialVoice);
            } else {
                const savedVoice = await AsyncStorage.getItem('@tambola_caller_voice');
                if (savedVoice) {
                    setCallerVoice(savedVoice as any);
                }
            }
        })();
        return () => {
            Speech.stop();
        };
    }, []);

    useEffect(() => {
        if (!isGameOver) {
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                deck, ptr: ptrRef.current, called: Array.from(calledSet),
                history, mode, speed, mute, isPlaying, elapsedSeconds, callerVoice,
            })).catch(() => {});
        }
    }, [deck, calledSet, history, mode, speed, mute, isPlaying, elapsedSeconds, callerVoice, isGameOver]);

    const isTimerActive = mode === 'manual'
        ? (calledSet.size > 0 && calledSet.size < 90 && !isGameOver)
        : (isPlaying && !isGameOver);

    useEffect(() => {
        let t: any = null;
        if (isTimerActive) {
            t = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
        }
        return () => { if (t) clearInterval(t); };
    }, [isTimerActive]);

    const speakNumber = async (num: number) => {
        if (mute) return;
        try {
            const nickname = getFunName(num);
            const isHindi = callerVoice === 'hindi_standard' || callerVoice === 'desi_bingo';
            const lang = isHindi ? 'hi-IN' : callerVoice === 'classic' ? 'en-GB' : callerVoice === 'fun_english' ? 'en-IN' : 'en-US';
            const textToSpeak = nickname && nickname.trim() !== ''
                ? `${num}. ${nickname}`
                : `${num}`;
            Speech.stop();
            Speech.speak(textToSpeak, {
                language: lang,
                pitch: 1.0,
                rate: 0.9,
            });
        } catch (e) {}
    };

    const callNext = () => {
        if (ptrRef.current >= deck.length) {
            setIsGameOver(true);
            setIsPlaying(false);
            recordGameHistory();
            return;
        }

        const num = deck[ptrRef.current];
        ptrRef.current += 1;

        setCalledSet(prev => {
            const next = new Set(prev);
            next.add(num);
            return next;
        });
        setHistory(prev => [num, ...prev]);

        speakNumber(num);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}

        if (isPartyHost && isBroadcasting) {
            broadcastPartyMessage(partyRoomCode, {
                type: 'NUMBER_CALLED',
                currentNumber: num,
                calledList: [num, ...history],
                totalCalled: ptrRef.current,
                hostName: hostName || 'Host',
                timestamp: Date.now(),
            });
        }

        if (ptrRef.current >= 90) {
            setIsGameOver(true);
            setIsPlaying(false);
            recordGameHistory();
            AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        }
    };

    const recordGameHistory = async () => {
        try {
            const entry = {
                id: Math.random().toString(),
                date: Date.now(),
                durationSeconds: elapsedSeconds,
                numbersCalled: ptrRef.current,
                mode,
                speed,
            };
            const existingStr = await AsyncStorage.getItem('@tambola_history');
            const historyList = existingStr ? JSON.parse(existingStr) : [];
            historyList.unshift(entry);
            await AsyncStorage.setItem('@tambola_history', JSON.stringify(historyList));
        } catch (e) {}
    };

    useEffect(() => {
        if (mode === 'auto' && isPlaying && !isGameOver) {
            intervalRef.current = setInterval(() => {
                callNext();
            }, SPEEDS_MS[speed]) as unknown as number;
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
        };
    }, [mode, isPlaying, speed, isGameOver]);

    const restartGame = async () => {
        const doReset = async () => {
            Speech.stop();
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsPlaying(false);
            setIsGameOver(false);
            setElapsedSeconds(0);
            const newDeck = createShuffledNumbers();
            setDeck(newDeck);
            ptrRef.current = 0;
            setCalledSet(new Set());
            setHistory([]);
            try { await AsyncStorage.removeItem(STORAGE_KEY); } catch (e) {}
            await tryShowInterstitial(true);
        };

        if (!showAds) {
            Alert.alert(
                'Reset Game?',
                'All called numbers and progress will be reset.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reset', style: 'destructive', onPress: doReset },
                ]
            );
            return;
        }

        Alert.alert(
            'Reset Game?',
            'All called numbers and progress will be reset.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Go Ad-Free (30m)',
                    onPress: async () => {
                        if (rewardedLoaded) {
                            const shown = await showRewarded();
                            if (!shown) Alert.alert('Notice', 'Please try again in a moment.');
                        } else {
                            Alert.alert('Loading...', 'Ad is loading. Try again shortly.');
                        }
                    },
                },
                {
                    text: 'Reset Game',
                    style: 'destructive',
                    onPress: doReset,
                },
            ]
        );
    };

    const tryShowInterstitial = async (forceOnRestart: boolean = false) => {
        if (!showAds) return;
        const count = calledSet.size;
        if ((count >= 3 || forceOnRestart) && shouldShowInterstitial()) {
            if (loaded) {
                recordInterstitialShown();
                await show();
            }
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleCallPlayPress = () => {
        if (mode === 'manual') callNext();
        else setIsPlaying(prev => !prev);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `I just hosted a Tambola game! All 90 numbers called in ${formatTime(elapsedSeconds)}. Download Tambola Number Caller to play at your next game night!`,
            });
        } catch (e) {}
    };

    const getFunName = (num: number): string => {
        try {
            const lists = numberStyle() as any[];
            const isHindi = callerVoice === 'hindi_standard' || callerVoice === 'desi_bingo';
            const list = isHindi ? lists[1] : lists[0];
            return String((list && list[num]) || '');
        } catch (e) {
            return '';
        }
    };

    const latestNumber = history.length > 0 ? history[0] : null;
    const progressPercent = Math.min(100, Math.round((calledSet.size / 90) * 100));

    return (
        <View style={[styles.safe, { backgroundColor: T.background }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* ── TOP HERO CARD ── */}
            <View style={[styles.heroCard, { backgroundColor: T.primary, paddingTop: topInset + 6 }]}>
                {/* Navigation Bar inside hero */}
                <View style={styles.heroNavBar}>
                    <TouchableOpacity
                        onPress={() => { tryShowInterstitial(); navigation.goBack(); }}
                        style={styles.heroNavBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={26} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.heroNavCenter}>
                        <Text style={styles.heroTitleText}>Tambola</Text>
                        <View style={styles.heroTimerPill}>
                            <Text style={styles.heroTimerText}>{formatTime(elapsedSeconds)}</Text>
                        </View>
                    </View>

                    <View style={styles.heroNavRight}>
                        <TouchableOpacity
                            onPress={() => {
                                if (!isPartyHost) { setIsPartyHost(true); setIsBroadcasting(true); }
                                setPartyModalVisible(true);
                            }}
                            style={styles.heroNavBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="people-outline" size={22} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('HistoryModal', { historySnapshot: history })}
                            style={styles.heroNavBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="list-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Big Number in Center */}
                <View style={styles.bigNumberWrap}>
                    <Text style={styles.bigNumberText}>
                        {latestNumber !== null ? latestNumber : '0'}
                    </Text>
                    <Text style={styles.nicknameText} numberOfLines={1}>
                        {latestNumber !== null ? getFunName(latestNumber) : 'ready to call'}
                    </Text>
                </View>

                {/* Meta Badges Row */}
                <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>{calledSet.size} / 90</Text>
                    </View>
                    <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>
                            {mode === 'manual' ? 'Manual' : `Auto • ${speed}`}
                        </Text>
                    </View>
                    <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>
                            {isPartyHost && isBroadcasting ? `Room ${partyRoomCode}` : 'Solo'}
                        </Text>
                    </View>
                </View>

                {/* Horizontal Progress Track inside Hero Card */}
                <View style={styles.heroProgressTrack}>
                    <View style={[styles.heroProgressFill, { width: `${progressPercent}%` }]} />
                </View>
            </View>

            {/* ── CLAIM TOAST ── */}
            {latestClaimToast && (
                <Animated.View style={[styles.claimToast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                    <TouchableOpacity onPress={() => { setLatestClaimToast(null); setPartyModalVisible(true); }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="trophy" size={16} color="#fff" />
                            <Text style={styles.claimToastText}>{latestClaimToast}</Text>
                        </View>
                        <Text style={styles.claimToastSub}>Tap to verify winning claim</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* ── PREVIOUS NUMBERS STRIP ("PREV") ── */}
            <View style={styles.prevStrip}>
                <Text style={styles.prevLabel}>PREV</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prevList}>
                    {history.length > 1 ? (
                        history.slice(1, 7).map((num, i) => (
                            <View key={i} style={[styles.prevChip, isDark && { backgroundColor: T.secondary }]}>
                                <Text style={[styles.prevChipText, isDark && { color: T.text }]}>{num}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={[styles.prevEmptyText, isDark && { color: '#6b7280' }]}>None yet</Text>
                    )}
                </ScrollView>
            </View>

            {/* ── 1-90 NUMBER BOARD ── */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
            >
                <NumberGrid
                    calledNumbersSet={calledSet}
                    latestNumber={latestNumber}
                    onTilePress={() => {}}
                />
            </ScrollView>

            {/* ── BOTTOM FLOATING ACTION BAR ── */}
            <View style={[styles.controlsBar, { backgroundColor: T.background, borderTopColor: isDark ? (T.id === 'midnight' ? '#222f44' : '#2a1f49') : '#f0f1f4' }]}>
                {/* Options button */}
                <TouchableOpacity
                    style={[styles.sideControlBtn, { backgroundColor: T.cardBg, borderColor: isDark ? (T.id === 'midnight' ? '#222f44' : '#2a1f49') : '#e5e7eb' }]}
                    onPress={() => setOptionsVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="options-outline" size={22} color={T.text} />
                </TouchableOpacity>

                {/* Primary Call CTA */}
                <TouchableOpacity
                    style={[styles.mainCallBtn, { backgroundColor: T.primary }]}
                    onPress={handleCallPlayPress}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name={mode === 'manual' ? 'play' : isPlaying ? 'pause' : 'play'}
                        size={18}
                        color="#ffffff"
                    />
                    <Text style={styles.mainCallBtnText}>
                        {mode === 'manual'
                            ? 'Call number'
                            : isPlaying
                            ? 'Pause'
                            : 'Call number'}
                    </Text>
                </TouchableOpacity>

                {/* Restart button */}
                <TouchableOpacity
                    style={[styles.sideControlBtn, { backgroundColor: T.cardBg, borderColor: isDark ? '#2a1f49' : '#e5e7eb' }]}
                    onPress={restartGame}
                    activeOpacity={0.8}
                >
                    <Ionicons name="refresh-outline" size={22} color={T.text} />
                </TouchableOpacity>
            </View>

            {/* ── OPTIONS MODAL ── */}
            <Modal visible={optionsVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: T.cardBg, borderColor: isDark ? (T.id === 'midnight' ? '#222f44' : '#2a1f49') : '#e5e7eb', paddingBottom: bottomInset + 12 }]}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeaderRow}>
                            <Text style={[styles.modalTitle, { color: T.text }]}>Game Settings</Text>
                            <TouchableOpacity onPress={() => setOptionsVisible(false)}>
                                <Ionicons name="close" size={24} color={T.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                            <Text style={[styles.modalSectionLabel, { color: T.textLight }]}>Mode</Text>
                            <View style={styles.pillRow}>
                                <TouchableOpacity
                                    style={[styles.optionPill, mode === 'manual' && { backgroundColor: T.secondary, borderColor: T.primary }]}
                                    onPress={() => { setMode('manual'); setIsPlaying(false); }}
                                >
                                    <Text style={[styles.optionPillText, mode === 'manual' && { color: T.primary, fontWeight: '800' }]}>Manual</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.optionPill, mode === 'auto' && { backgroundColor: T.secondary, borderColor: T.primary }]}
                                    onPress={() => setMode('auto')}
                                >
                                    <Text style={[styles.optionPillText, mode === 'auto' && { color: T.primary, fontWeight: '800' }]}>Automatic</Text>
                                </TouchableOpacity>
                            </View>

                            {mode === 'auto' && (
                                <>
                                    <Text style={[styles.modalSectionLabel, { color: T.textLight }]}>Speed</Text>
                                    <View style={styles.pillRow}>
                                        {(['slow', 'medium', 'fast'] as const).map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[styles.optionPill, speed === s && { backgroundColor: T.secondary, borderColor: T.primary }]}
                                                onPress={() => setSpeed(s)}
                                            >
                                                <Text style={[styles.optionPillText, speed === s && { color: T.primary, fontWeight: '800' }]}>
                                                    {s === 'slow' ? 'Relaxed' : s === 'medium' ? 'Normal' : 'Fast'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            <Text style={[styles.modalSectionLabel, { color: T.textLight }]}>Audio</Text>
                            <View style={styles.pillRow}>
                                <TouchableOpacity
                                    style={[styles.optionPill, !mute && { backgroundColor: T.secondary, borderColor: T.primary }]}
                                    onPress={() => setMute(false)}
                                >
                                    <Text style={[styles.optionPillText, !mute && { color: T.primary, fontWeight: '800' }]}>Sound On</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.optionPill, mute && { backgroundColor: T.secondary, borderColor: T.primary }]}
                                    onPress={() => setMute(true)}
                                >
                                    <Text style={[styles.optionPillText, mute && { color: T.primary, fontWeight: '800' }]}>Muted</Text>
                                </TouchableOpacity>
                            </View>

                            {/* ── CALLER VOICE ── */}
                            <Text style={[styles.modalSectionLabel, { color: T.textLight }]}>Caller Voice</Text>
                            <View style={styles.pillRow}>
                                {VOICE_OPTIONS.map(v => (
                                    <TouchableOpacity
                                        key={v.id}
                                        style={[styles.optionPill, callerVoice === v.id && { backgroundColor: T.secondary, borderColor: T.primary }]}
                                        onPress={() => handleVoiceChange(v.id)}
                                    >
                                        <Text style={[styles.optionPillText, callerVoice === v.id && { color: T.primary, fontWeight: '800' }]}>
                                            {v.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.modalDoneBtn, { backgroundColor: T.primary, marginTop: 22, marginBottom: 8 }]}
                                onPress={() => setOptionsVisible(false)}
                            >
                                <Text style={styles.modalDoneText}>Done</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── GAME OVER MODAL ── */}
            <Modal visible={isGameOver} animationType="fade" transparent>
                <View style={styles.gameOverOverlay}>
                    <View style={[styles.gameOverCard, { backgroundColor: T.cardBg }]}>
                        <Ionicons name="trophy" size={54} color="#ffd700" style={{ marginBottom: 10 }} />
                        <Text style={[styles.gameOverTitle, { color: T.text }]}>Game Complete!</Text>
                        <Text style={[styles.gameOverSub, { color: T.textLight }]}>All 90 numbers have been called.</Text>

                        <View style={[styles.statBox, { backgroundColor: isDark ? '#1b1433' : '#f9f9f9', borderColor: isDark ? '#2a1f49' : '#eee' }]}>
                            <Text style={[styles.statLabel, { color: T.textLight }]}>Time Taken</Text>
                            <Text style={[styles.statValue, { color: T.primary }]}>{formatTime(elapsedSeconds)}</Text>
                        </View>

                        <TouchableOpacity style={[styles.gameOverBtn, { backgroundColor: T.primary }]} onPress={handleShare}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="share-social-outline" size={18} color="#fff" />
                                <Text style={styles.gameOverBtnText}>Share Result</Text>
                            </View>
                        </TouchableOpacity>

                        {showAds && (
                            <TouchableOpacity
                                style={[styles.gameOverBtnOutline, { borderColor: isDark ? '#ff9800' : '#e65100', backgroundColor: isDark ? '#1b1433' : '#fff3e0' }]}
                                onPress={async () => {
                                    if (rewardedLoaded) {
                                        const shown = await showRewarded();
                                        if (!shown) Alert.alert('Notice', 'Please try again shortly.');
                                    } else {
                                        Alert.alert('Loading...', 'Ad is loading. Try again in a moment.');
                                    }
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="play-circle-outline" size={18} color={isDark ? '#ffb74d' : '#e65100'} />
                                    <Text style={[styles.gameOverBtnOutlineText, { color: isDark ? '#ffb74d' : '#e65100' }]}>Watch Video → 30m Ad-Free</Text>
                                </View>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={[styles.gameOverBtnGhost, { backgroundColor: isDark ? '#251b40' : '#f5f5f5' }]} onPress={restartGame}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Ionicons name="refresh" size={18} color={T.text} />
                                <Text style={[styles.gameOverBtnGhostText, { color: T.text }]}>Start New Game</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    {isGameOver && <ConfettiCannon count={150} origin={{ x: 0, y: 0 }} fallSpeed={2500} fadeOut />}
                </View>
            </Modal>

            <HostPartyModal
                visible={partyModalVisible}
                onClose={() => setPartyModalVisible(false)}
                roomCode={partyRoomCode}
                isBroadcasting={isBroadcasting}
                claims={partyClaims}
                onToggleBroadcast={() => setIsBroadcasting(prev => !prev)}
                onUpdateClaimStatus={(claimId, status) => {
                    setPartyClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c));
                }}
                calledCount={calledSet.size}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },

    // Top Hero Card
    heroCard: {
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        paddingHorizontal: 20,
        paddingBottom: 22,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 6,
    },
    heroNavBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    heroNavBtn: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroNavCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroTitleText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    heroTimerPill: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    heroTimerText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '800',
    },
    heroNavRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    // Big Number
    bigNumberWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    bigNumberText: {
        fontSize: 108,
        fontWeight: '900',
        color: '#ffffff',
        lineHeight: 114,
        letterSpacing: -2,
    },
    nicknameText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        marginTop: 2,
        marginBottom: 14,
    },

    // Meta Badges
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    metaPill: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
    },
    metaPillText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '800',
    },

    // Hero Progress
    heroProgressTrack: {
        height: 3.5,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.25)',
        width: '100%',
        overflow: 'hidden',
    },
    heroProgressFill: {
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 2,
    },

    // Previous Strip
    prevStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    prevLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#6b7280',
        letterSpacing: 0.8,
    },
    prevList: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    prevChip: {
        backgroundColor: '#f2f4f7',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    prevChipText: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '800',
    },
    prevEmptyText: {
        color: '#9ca3af',
        fontSize: 12,
        fontStyle: 'italic',
    },

    // Claim toast
    claimToast: {
        position: 'absolute',
        top: isIOS ? 105 : 72,
        left: 16,
        right: 16,
        backgroundColor: '#7b1fa2',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        zIndex: 999,
    },
    claimToastText: { color: '#fff', fontWeight: '900', fontSize: 15 },
    claimToastSub: { color: '#e1bee7', fontSize: 11, marginTop: 2 },

    // Floating Controls Bar
    controlsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        paddingBottom: isIOS ? 20 : 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f1f4',
    },
    sideControlBtn: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    mainCallBtn: {
        flex: 1,
        height: 50,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    mainCallBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
    },

    // Options Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        maxHeight: '85%',
    },
    modalHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '900' },
    modalSectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 14, marginBottom: 8 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
    optionPillText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
    modalDoneBtn: { alignSelf: 'stretch', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    modalDoneText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    // Game over modal
    gameOverOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    gameOverCard: { borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
    gameOverTitle: { fontSize: 26, fontWeight: '900', marginBottom: 4 },
    gameOverSub: { fontSize: 14, marginBottom: 20 },
    statBox: { borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', marginBottom: 20, borderWidth: 1 },
    statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
    statValue: { fontSize: 40, fontWeight: '900', marginTop: 4 },
    gameOverBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
    gameOverBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    gameOverBtnOutline: { width: '100%', paddingVertical: 13, borderRadius: 14, alignItems: 'center', borderWidth: 2, marginBottom: 10 },
    gameOverBtnOutlineText: { fontWeight: '800', fontSize: 14 },
    gameOverBtnGhost: { width: '100%', paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
    gameOverBtnGhostText: { fontWeight: '700', fontSize: 15 },
});
