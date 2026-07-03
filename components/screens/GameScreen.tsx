// components/screens/GameScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Share,
    ScrollView,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { RootStackParamList } from '../../app/(tabs)/index';
import NumberGridImported from '../../components/NumberGrid';
import { logEvent, logScreenView } from '../../utils/analytics';
import { useRewardedAd } from '../../utils/hooks/useRewardedAd';
import { numberStyle } from '../../utils/numberStyle';
import { useAdState } from '../../utils/store/adState';
import { useInterstitial } from '../ads/Interstitial';
import { useTheme } from '../../utils/store/themeState';
import { shouldShowInterstitial, recordInterstitialShown } from '../../utils/adFrequency';



function ensureComponent<T extends React.ComponentType<any> | undefined>(Comp: T, name: string): React.ComponentType<any> {
    if (Comp && typeof Comp === 'function') return Comp as React.ComponentType<any>;
    const Placeholder: React.FC = () => (
        <View style={{ padding: 12 }}>
            <Text style={{ color: 'red', fontWeight: '700' }}>{name} missing</Text>
        </View>
    );
    return Placeholder;
}

const NumberGrid = ensureComponent(NumberGridImported as any, 'NumberGrid');

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const STORAGE_KEY = '@tambola_state_v1';
const SPEEDS_MS = { slow: 3000, medium: 1500, fast: 700 } as const;

// Get device type ios/android to adjust layout if needed
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

function createShuffledNumbers(): number[] {
    const arr = Array.from({ length: 90 }, (_, i) => i + 1);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default function GameScreen({ route, navigation }: Props) {
    const { currentTheme } = useTheme();
    const { initialMode, initialSpeed, initialMute, hostName } = route.params ?? {};
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
    const [callerVoice, setCallerVoice] = useState<'classic' | 'fun_english' | 'hindi_standard' | 'desi_bingo'>('fun_english');
    const intervalRef = useRef<number | null>(null);
    const { loaded, show } = useInterstitial();
    const { showAds } = useAdState();
    const { loaded: rewardedLoaded, show: showRewarded } = useRewardedAd();

    const [optionsVisible, setOptionsVisible] = useState(false);

    // hide navigation header entirely (clean look)
    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);



    // ...

    // load state
    useEffect(() => {
        logScreenView('GameScreen');
        // ... rest of load state logic

        (async () => {
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
        })();
    }, []);

    // persist
    useEffect(() => {
        AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                deck,
                ptr: ptrRef.current,
                called: Array.from(calledSet),
                history,
                mode,
                speed,
                mute,
                isPlaying,
                elapsedSeconds,
                callerVoice,
            })
        ).catch(() => { });
    }, [deck, calledSet, history, mode, speed, mute, isPlaying, elapsedSeconds, callerVoice]);

    const isTimerActive = mode === 'manual'
        ? (calledSet.size > 0 && calledSet.size < 90 && !isGameOver)
        : (isPlaying && calledSet.size < 90 && !isGameOver);

    useEffect(() => {
        let timerInterval: number | null = null;
        if (isTimerActive) {
            timerInterval = window.setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000) as unknown as number;
        }
        return () => {
            if (timerInterval) clearInterval(timerInterval as unknown as number);
        };
    }, [isTimerActive]);

    useEffect(() => {
        if (mode === 'auto' && isPlaying) startAuto();
        else stopAuto();
        return stopAuto;
    }, [mode, isPlaying, speed]);

    useEffect(() => () => stopAuto(), []);

    function startAuto() {
        stopAuto();
        intervalRef.current = window.setInterval(drawNext, SPEEDS_MS[speed]) as unknown as number;
    }

    function stopAuto() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current as unknown as number);
            intervalRef.current = null;
        }
    }

    function speakNumber(n: number) {
        if (mute) return;
        try {
            Speech.stop();
            const styles = numberStyle();
            
            const isHindi = callerVoice === 'hindi_standard' || callerVoice === 'desi_bingo';
            const isFun = callerVoice === 'fun_english' || callerVoice === 'desi_bingo';
            
            let styledNumber = isHindi
                ? styles[1][n as keyof typeof styles[1]]
                : styles[0][n as keyof typeof styles[0]];
                
            styledNumber = `${styledNumber}, Number ${n}`;
            
            let toSpeak = n.toString().split('').join(' ');
            toSpeak = n < 10 ? `Single ${toSpeak}` : `${toSpeak}, ${n}`;
            
            Speech.speak(
                isFun ? styledNumber : toSpeak,
                { rate: 0.75, language: isHindi ? 'hi-IN' : 'en-IN' }
            );
        } catch { }
    }

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const saveGameToHistory = async () => {
        try {
            const historyStr = await AsyncStorage.getItem('@tambola_history');
            const historyList = historyStr ? JSON.parse(historyStr) : [];
            const newEntry = {
                id: Date.now().toString(),
                date: Date.now(),
                durationSeconds: elapsedSeconds,
                numbersCalled: 90,
                mode,
                speed,
            };
            await AsyncStorage.setItem('@tambola_history', JSON.stringify([newEntry, ...historyList].slice(0, 50)));
        } catch (e) { }
    };

    // Frequency-capped interstitial helper
    function tryShowInterstitial() {
        if (!showAds) return;
        if (!shouldShowInterstitial()) return;
        show().then(shown => {
            if (shown) {
                recordInterstitialShown();
                console.log('[Ad] Interstitial shown (capped)');
            }
        });
    }

    function drawNext() {
        const ptr = ptrRef.current;
        if (ptr >= deck.length) {
            stopAuto();
            setIsPlaying(false);
            logEvent('game_complete', { mode, speed, timeTaken: elapsedSeconds });
            setIsGameOver(true);
            saveGameToHistory();
            // Show interstitial on game complete — natural pause, high eCPM
            tryShowInterstitial();
            return;
        }
        const num = deck[ptr];
        ptrRef.current = ptr + 1;
        setCalledSet(prev => new Set(prev).add(num));
        setHistory(prev => [num, ...prev]);
        speakNumber(num);
    }

    function restartGame() {
        logEvent('game_restart', { mode, speed });
        stopAuto();
        setDeck(createShuffledNumbers());
        ptrRef.current = 0;
        setCalledSet(new Set());
        setHistory([]);
        setIsPlaying(false);
        setElapsedSeconds(0);
        setIsGameOver(false);
        // Show interstitial on restart — frequency capped
        tryShowInterstitial();
        try { Speech.stop(); } catch { }
    }

    function handleRestart() {
        if (!showAds) {
            // Standard confirmation for ad-free users
            Alert.alert(
                'Restart Game',
                'Are you sure you want to restart?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Restart', style: 'destructive', onPress: restartGame }
                ]
            );
            return;
        }

        // Prompt for Ad-Free or Interstitial
        Alert.alert(
            'Restart Game',
            'Watch a short video for 30 mins Ad-Free game?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Go Ad-Free',
                    onPress: async () => {
                        if (rewardedLoaded) {
                            const shown = await showRewarded();
                            if (!shown) Alert.alert('Error', 'Ad not ready yet.');
                        } else {
                            Alert.alert('Ad not ready', 'Rewarded ad is loading, please wait.');
                        }
                    }
                },
                {
                    text: 'Restart Game',
                    onPress: restartGame
                }
            ]
        );
    }

    const isManual = mode === 'manual';
    const callPlayLabel = isManual
        ? 'Call Number'
        : isPlaying
            ? 'Pause Auto'
            : 'Play Auto';

    function handleCallPlayPress() {
        if (isManual) {
            drawNext();
        } else {
            setIsPlaying(prev => !prev);
        }
    }

    const handleShare = async () => {
        try {
            await Share.share({
                message: `I just hosted a Tambola game using the Tambola Number Caller app! All 90 numbers called in ${formatTime(elapsedSeconds)}! 🎉 Download the app to play your next game.`,
            });
        } catch (e) {}
    };

    const getFunName = (num: number) => {
        const styles = numberStyle();
        const isHindi = callerVoice === 'hindi_standard' || callerVoice === 'desi_bingo';
        return isHindi ? styles[1][num as keyof typeof styles[1]] : styles[0][num as keyof typeof styles[0]];
    };
    const latestNumber = history.length > 0 ? history[0] : null;

    return (
        <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
            {/* Custom top bar */}
            <View style={[styles.topBar, { backgroundColor: currentTheme.isDark ? '#0f0c1b' : '#f5f5f5', borderBottomColor: currentTheme.isDark ? '#2a1f49' : '#ddd', marginTop: isIOS ? 50 : 20 }]}>
                <TouchableOpacity
                    onPress={() => {
                        // Show interstitial on exit — high-intent moment
                        tryShowInterstitial();
                        navigation.goBack();
                    }}
                    style={[styles.topBtn, { backgroundColor: currentTheme.isDark ? '#3e150a' : '#ef5350' }]}
                >
                    <Text style={styles.topBtnText}>← Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('HistoryModal', { historySnapshot: history })}
                    style={[styles.topBtn, { backgroundColor: currentTheme.primary }]}
                >
                    <Text style={styles.topBtnText}>History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleRestart}
                    style={[styles.topBtn, { backgroundColor: currentTheme.isDark ? '#3e2e0a' : '#ffa726' }]}
                >
                    <Text style={styles.topBtnText}>Restart</Text>
                </TouchableOpacity>
            </View>

            {/* Scrollable middle area */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Title section */}
                <View style={[styles.header, { borderBottomColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
                    <Text style={[styles.title, { color: currentTheme.text }]}>{hostName ? `${hostName}'s Game` : 'Tambola Number Caller'}</Text>
                    <View style={styles.subtitleRow}>
                        <Text style={[styles.subtitle, { color: currentTheme.textLight }]}>
                            {mode.toUpperCase()} • {speed.toUpperCase()}
                        </Text>
                        <Text style={[styles.timerText, { color: currentTheme.isDark ? '#81c784' : '#2e7d32', backgroundColor: currentTheme.isDark ? '#1e3822' : '#e8f5e9' }]}>⏱ {formatTime(elapsedSeconds)}</Text>
                    </View>
                </View>

                {/* Spotlight Number */}
                {latestNumber !== null ? (
                    <View style={styles.spotlightContainer}>
                        <View style={[styles.spotlightBubble, { backgroundColor: currentTheme.primary, shadowColor: currentTheme.primary }]}>
                            <Text style={styles.spotlightNumber}>{latestNumber}</Text>
                            <Text style={[styles.spotlightName, { color: '#ffffff' }]}>{getFunName(latestNumber)}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.spotlightPlaceholder} />
                )}

                {/* Grid */}
                <NumberGrid calledNumbersSet={calledSet} onTilePress={() => { }} />
            </ScrollView>

            {/* Controls area: Options + Call/Play + Restart */}
            <View style={[styles.controlsBar, { backgroundColor: currentTheme.cardBg, borderTopColor: currentTheme.isDark ? '#2a1f49' : '#eee' }]}>
                <TouchableOpacity
                    style={[styles.optionsBtn, { backgroundColor: currentTheme.isDark ? '#1b1433' : '#f9f9f9', borderColor: currentTheme.isDark ? '#2a1f49' : '#e0e0e0' }]}
                    onPress={() => setOptionsVisible(true)}
                >
                    <Text style={[styles.optionsText, { color: currentTheme.text }]}>⚙ Game Options</Text>
                </TouchableOpacity>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: currentTheme.primary }]}
                        onPress={handleCallPlayPress}
                    >
                        <Text style={styles.actionText}>{callPlayLabel}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: currentTheme.isDark ? '#3e150a' : '#ef5350' }]}
                        onPress={handleRestart}
                    >
                        <Text style={styles.actionText}>Restart</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Options Modal */}
            <Modal
                visible={optionsVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setOptionsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBg }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: currentTheme.isDark ? '#2a1f49' : '#eee' }]}>
                            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Game Options</Text>
                            <TouchableOpacity onPress={() => setOptionsVisible(false)}>
                                <Text style={[styles.modalClose, { color: currentTheme.text }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>Mode</Text>
                            <View style={styles.optionRow}>
                                <OptionPill
                                    label="Manual"
                                    selected={mode === 'manual'}
                                    onPress={() => setMode('manual')}
                                    currentTheme={currentTheme}
                                />
                                <OptionPill
                                    label="Auto"
                                    selected={mode === 'auto'}
                                    onPress={() => setMode('auto')}
                                    currentTheme={currentTheme}
                                />
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>Speed</Text>
                            <View style={styles.optionRow}>
                                <OptionPill
                                    label="Slow"
                                    selected={speed === 'slow'}
                                    onPress={() => setSpeed('slow')}
                                    currentTheme={currentTheme}
                                />
                                <OptionPill
                                    label="Med"
                                    selected={speed === 'medium'}
                                    onPress={() => setSpeed('medium')}
                                    currentTheme={currentTheme}
                                />
                                <OptionPill
                                    label="Fast"
                                    selected={speed === 'fast'}
                                    onPress={() => setSpeed('fast')}
                                    currentTheme={currentTheme}
                                />
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>Sound</Text>
                            <View style={styles.optionRow}>
                                <OptionPill
                                    label="Mute"
                                    selected={mute}
                                    onPress={() => setMute(true)}
                                    currentTheme={currentTheme}
                                />
                                <OptionPill
                                    label="Unmute"
                                    selected={!mute}
                                    onPress={() => setMute(false)}
                                    currentTheme={currentTheme}
                                />
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={[styles.modalSectionTitle, { color: currentTheme.textLight }]}>Caller Voice</Text>
                            <View style={styles.optionRow}>
                                <OptionPill
                                    label="Classic (EN)"
                                    selected={callerVoice === 'classic'}
                                    onPress={() => setCallerVoice('classic')}
                                    currentTheme={currentTheme}
                                />
                                <OptionPill
                                    label="Fun (EN)"
                                    selected={callerVoice === 'fun_english'}
                                    onPress={() => setCallerVoice('fun_english')}
                                    currentTheme={currentTheme}
                                />
                                <OptionPill
                                    label="Standard (HI)"
                                    selected={callerVoice === 'hindi_standard'}
                                    onPress={() => setCallerVoice('hindi_standard')}
                                    currentTheme={currentTheme}
                                />
                                <OptionPill
                                    label="Desi Bingo"
                                    selected={callerVoice === 'desi_bingo'}
                                    onPress={() => setCallerVoice('desi_bingo')}
                                    currentTheme={currentTheme}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalDoneBtn, { backgroundColor: currentTheme.primary }]}
                            onPress={() => setOptionsVisible(false)}
                        >
                            <Text style={styles.modalDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Mini footer showing latest numbers */}
            <View style={[styles.footer, { backgroundColor: currentTheme.cardBg, borderTopColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
                <Text style={[styles.footerTitle, { color: currentTheme.textLight }]}>Latest Called</Text>
                <FlatList
                    data={history.slice(0, 6)}
                    keyExtractor={item => String(item)}
                    horizontal
                    renderItem={({ item }) => (
                        <View style={[styles.latestPill, { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }]}>
                            <Text style={[styles.latestText, { color: currentTheme.primaryDark }]}>{item}</Text>
                        </View>
                    )}
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            {/* Post-Game Summary Modal */}
            <Modal visible={isGameOver} animationType="fade" transparent>
                <View style={styles.gameOverOverlay}>
                    <View style={styles.gameOverContent}>
                        <Text style={styles.gameOverTitle}>Game Finished! 🎉</Text>
                        <Text style={styles.gameOverText}>You called all 90 numbers.</Text>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Time Taken</Text>
                            <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
                        </View>
                        
                        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: currentTheme.primary }]} onPress={handleShare}>
                            <Text style={styles.shareBtnText}>Share Result</Text>
                        </TouchableOpacity>

                        {/* Rewarded Ad CTA — high-intent moment */}
                        {showAds && (
                            <TouchableOpacity
                                style={[styles.rewardedCta, { backgroundColor: currentTheme.isDark ? '#1b1433' : '#fff3e0', borderColor: currentTheme.isDark ? '#ff9800' : '#ffb74d' }]}
                                onPress={async () => {
                                    if (rewardedLoaded) {
                                        const shown = await showRewarded();
                                        if (!shown) Alert.alert('Ad not ready', 'Please try again in a moment.');
                                    } else {
                                        Alert.alert('Loading...', 'Rewarded ad is loading. Try again shortly.');
                                    }
                                }}
                            >
                                <Text style={[styles.rewardedCtaText, { color: currentTheme.isDark ? '#ffb74d' : '#e65100' }]}>
                                    🎬 Watch Ad → Go Ad-Free 30 min
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={[styles.modalDoneBtn, { marginTop: 12, backgroundColor: currentTheme.isDark ? '#1b1433' : '#444' }]} onPress={() => {
                            restartGame();
                        }}>
                            <Text style={styles.modalDoneText}>Start New Game</Text>
                        </TouchableOpacity>
                    </View>
                    {isGameOver && <ConfettiCannon count={150} origin={{x: 0, y: 0}} fallSpeed={2500} fadeOut />}
                </View>
            </Modal>
        </View>
    );
}

type OptionPillProps = {
    label: string;
    selected?: boolean;
    onPress: () => void;
    currentTheme: any;
};

const OptionPill: React.FC<OptionPillProps> = ({ label, selected, onPress, currentTheme }) => (
    <TouchableOpacity
        style={[
            styles.optionPill,
            { backgroundColor: currentTheme.isDark ? '#1a122e' : '#f5f5f5', borderColor: currentTheme.isDark ? '#2a1f49' : '#e0e0e0' },
            selected && { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }
        ]}
        onPress={onPress}
    >
        <Text style={[
            styles.optionPillText,
            { color: currentTheme.textLight },
            selected && { color: currentTheme.primary, fontWeight: '800' }
        ]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginTop: isIOS ? 50 : 20,
    },
    topBtn: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    topBtnText: { color: '#fff', fontWeight: '700' },
    header: { alignItems: 'center', paddingTop: 8 },
    title: { fontSize: 20, fontWeight: '800' },
    subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    subtitle: { fontSize: 12, color: '#666' },
    timerText: { fontSize: 13, fontWeight: '700', color: '#d32f2f', backgroundColor: '#ffebee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    spotlightContainer: { alignItems: 'center', marginVertical: 10 },
    spotlightBubble: { backgroundColor: '#1976d2', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, alignItems: 'center', minWidth: 200, shadowColor: '#1976d2', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
    spotlightNumber: { color: '#fff', fontSize: 28, fontWeight: '900' },
    spotlightName: { color: '#e3f2fd', fontSize: 13, fontWeight: '700', marginTop: 2 },
    spotlightPlaceholder: { height: 75 },

    controlsBar: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fafafa',
    },
    optionsBtn: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    optionsText: {
        fontSize: 13,
        fontWeight: '600',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    footer: { padding: 12, borderTopWidth: 1, borderTopColor: '#eee' },
    footerTitle: { fontWeight: '700', marginBottom: 8 },
    latestPill: {
        backgroundColor: '#e0e0e0',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginRight: 8,
    },
    latestText: { fontWeight: '700' },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: isIOS ? 24 : 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalClose: {
        fontSize: 18,
    },
    modalSection: {
        marginTop: 10,
    },
    modalSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
        color: '#555',
    },
    optionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
    },
    optionPillSelected: {
        backgroundColor: '#1976d2',
        borderColor: '#1976d2',
    },
    optionPillText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#333',
    },
    optionPillTextSelected: {
        color: '#fff',
    },
    modalDoneBtn: {
        marginTop: 16,
        alignSelf: 'stretch',
        backgroundColor: '#1976d2',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalDoneText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    gameOverOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    gameOverContent: { backgroundColor: '#fff', padding: 24, borderRadius: 20, width: '80%', alignItems: 'center' },
    gameOverTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8, color: '#111' },
    gameOverText: { fontSize: 15, color: '#555', marginBottom: 20 },
    statBox: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
    statLabel: { fontSize: 13, color: '#777', fontWeight: '700', textTransform: 'uppercase' },
    statValue: { fontSize: 32, fontWeight: '900', color: '#1976d2', marginTop: 4 },
    shareBtn: { backgroundColor: '#4caf50', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    shareBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    rewardedCta: {
        marginTop: 12,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
    },
    rewardedCtaText: {
        fontWeight: '800',
        fontSize: 14,
    },
});
