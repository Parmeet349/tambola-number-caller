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
} from 'react-native';
import { RootStackParamList } from '../../app/(tabs)/index';
import NumberGridImported from '../../components/NumberGrid';
import { numberStyle } from '../../utils/numberStyle';

import { useAdState } from '../../utils/store/adState';
import Banner from '../ads/Banner';
import { useInterstitial } from '../ads/Interstitial';

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
    const { initialMode, initialSpeed, initialMute } = route.params ?? {};
    const [deck, setDeck] = useState<number[]>(() => createShuffledNumbers());
    const ptrRef = useRef<number>(0);
    const [calledSet, setCalledSet] = useState<Set<number>>(new Set());
    const [history, setHistory] = useState<number[]>([]);
    const [mode, setMode] = useState<'manual' | 'auto'>(initialMode ?? 'manual');
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>(initialSpeed ?? 'medium');
    const [mute, setMute] = useState<boolean>(!!initialMute);
    const [languageSelected, setLanguageSelected] = useState<'english' | 'hindi'>('english');
    const [speakStyledNumber, setSpeakStyledNumber] = useState<boolean>(false);
    const intervalRef = useRef<number | null>(null);
    const { loaded, show } = useInterstitial();
    const { showAds } = useAdState();

    const [optionsVisible, setOptionsVisible] = useState(false);

    // hide navigation header entirely (clean look)
    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    // load state
    useEffect(() => {
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
            })
        ).catch(() => { });
    }, [deck, calledSet, history, mode, speed, mute, isPlaying]);

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
            let styledNumber = languageSelected === 'english'
                ? styles[0][n as keyof typeof styles[0]]
                : styles[1][n as keyof typeof styles[1]];
            styledNumber = `${styledNumber}, Number ${n}`;
            let toSpeak = n.toString().split('').join(' ');
            toSpeak = n < 10 ? `Single ${toSpeak}` : `${toSpeak}, ${n}`;
            Speech.speak(
                speakStyledNumber ? styledNumber : toSpeak,
                { rate: 0.75, language: languageSelected === 'hindi' ? 'hi-IN' : 'en-IN' }
            );
        } catch { }
    }

    function drawNext() {
        const ptr = ptrRef.current;
        if (ptr >= deck.length) {
            stopAuto();
            setIsPlaying(false);
            Alert.alert('Game Finished', 'All 90 numbers have been called!');
            return;
        }
        const num = deck[ptr];
        ptrRef.current = ptr + 1;
        setCalledSet(prev => new Set(prev).add(num));
        setHistory(prev => [num, ...prev]);
        speakNumber(num);
    }

    function restartGame() {
        stopAuto();
        setDeck(createShuffledNumbers());
        ptrRef.current = 0;
        setCalledSet(new Set());
        setHistory([]);
        setIsPlaying(false);
        if (showAds) {
            show().then(shown => {
                if (shown) console.log('Interstitial shown');
                else console.log('No interstitial to show');
            });
        }
        try { Speech.stop(); } catch { }
    }

    function handleRestart() {
        // Alert confirmation
        Alert.alert(
            'Restart Game',
            'Are you sure you want to restart the game? This will clear the current progress.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Restart', style: 'destructive', onPress: restartGame }
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

    return (
        <View style={styles.container}>
            {/* Custom top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.topBtn, { backgroundColor: '#ef5350' }]}
                >
                    <Text style={styles.topBtnText}>← Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('HistoryModal', { historySnapshot: history })}
                    style={[styles.topBtn, { backgroundColor: '#1976d2' }]}
                >
                    <Text style={styles.topBtnText}>History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleRestart}
                    style={[styles.topBtn, { backgroundColor: '#ffa726' }]}
                >
                    <Text style={styles.topBtnText}>Restart</Text>
                </TouchableOpacity>
            </View>

            {/* Title section */}
            <View style={styles.header}>
                <Text style={styles.title}>Tambola Number Caller</Text>
                <Text style={styles.subtitle}>
                    {mode.toUpperCase()} • {speed.toUpperCase()}
                </Text>
            </View>

            {/* Grid */}
            <NumberGrid calledNumbersSet={calledSet} onTilePress={() => { }} />

            {/* Controls area: Options + Call/Play + Restart */}
            <View style={styles.controlsBar}>
                <TouchableOpacity
                    style={styles.optionsBtn}
                    onPress={() => setOptionsVisible(true)}
                >
                    <Text style={styles.optionsText}>⚙ Game Options</Text>
                </TouchableOpacity>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#43a047' }]}
                        onPress={handleCallPlayPress}
                    >
                        <Text style={styles.actionText}>{callPlayLabel}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#ef5350' }]}
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Game Options</Text>
                            <TouchableOpacity onPress={() => setOptionsVisible(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Mode</Text>
                            <View style={styles.optionRow}>
                                <OptionPill
                                    label="Manual"
                                    selected={mode === 'manual'}
                                    onPress={() => setMode('manual')}
                                />
                                <OptionPill
                                    label="Auto"
                                    selected={mode === 'auto'}
                                    onPress={() => setMode('auto')}
                                />
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Speed</Text>
                            <View style={styles.optionRow}>
                                <OptionPill
                                    label="Slow"
                                    selected={speed === 'slow'}
                                    onPress={() => setSpeed('slow')}
                                />
                                <OptionPill
                                    label="Med"
                                    selected={speed === 'medium'}
                                    onPress={() => setSpeed('medium')}
                                />
                                <OptionPill
                                    label="Fast"
                                    selected={speed === 'fast'}
                                    onPress={() => setSpeed('fast')}
                                />
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Sound</Text>
                            <View style={styles.optionRow}>
                                <OptionPill
                                    label="Mute"
                                    selected={mute}
                                    onPress={() => setMute(true)}
                                />
                                <OptionPill
                                    label="Unmute"
                                    selected={!mute}
                                    onPress={() => setMute(false)}
                                />
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Language</Text>
                            <View style={styles.optionRow}>
                                <OptionPill
                                    label="English"
                                    selected={languageSelected === 'english'}
                                    onPress={() => setLanguageSelected('english')}
                                />
                                <OptionPill
                                    label="Hindi"
                                    selected={languageSelected === 'hindi'}
                                    onPress={() => setLanguageSelected('hindi')}
                                />
                            </View>
                        </View>

                        <View style={styles.modalSection}>
                            <Text style={styles.modalSectionTitle}>Fun Number</Text>
                            <View style={styles.optionRow}>
                                <OptionPill
                                    label="On"
                                    selected={speakStyledNumber}
                                    onPress={() => setSpeakStyledNumber(true)}
                                />
                                <OptionPill
                                    label="Off"
                                    selected={!speakStyledNumber}
                                    onPress={() => setSpeakStyledNumber(false)}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.modalDoneBtn}
                            onPress={() => setOptionsVisible(false)}
                        >
                            <Text style={styles.modalDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Mini footer showing latest numbers */}
            <View style={styles.footer}>
                <Text style={styles.footerTitle}>Latest Called</Text>
                <FlatList
                    data={history.slice(0, 6)}
                    keyExtractor={item => String(item)}
                    horizontal
                    renderItem={({ item }) => (
                        <View style={styles.latestPill}>
                            <Text style={styles.latestText}>{item}</Text>
                        </View>
                    )}
                    showsHorizontalScrollIndicator={false}
                />
            </View>

            <View style={{ flex: 1 }} />

            {/* banner at bottom */}
            {showAds && <Banner />}
        </View>
    );
}

type OptionPillProps = {
    label: string;
    selected?: boolean;
    onPress: () => void;
};

const OptionPill: React.FC<OptionPillProps> = ({ label, selected, onPress }) => (
    <TouchableOpacity
        style={[styles.optionPill, selected && styles.optionPillSelected]}
        onPress={onPress}
    >
        <Text style={[styles.optionPillText, selected && styles.optionPillTextSelected]}>
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
    subtitle: { fontSize: 12, color: '#666', marginTop: 4 },

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
});
