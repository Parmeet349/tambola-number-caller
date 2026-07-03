import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { Dimensions, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../utils/store/themeState';

export interface GameHistoryEntry {
    id: string;
    date: number;
    durationSeconds: number;
    numbersCalled: number;
    mode: 'manual' | 'auto';
    speed: string;
}

function generateTicket(): number[][] {
    const cols = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
        [30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
        [40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
        [50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
        [60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
        [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
        [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90]
    ];

    let valid = false;
    let ticket: number[][] = [];

    while (!valid) {
        ticket = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];

        let colCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (let r = 0; r < 3; r++) {
            let colsForThisRow = [];
            while (colsForThisRow.length < 5) {
                let c = Math.floor(Math.random() * 9);
                if (!colsForThisRow.includes(c) && colCounts[c] < 3) {
                    colsForThisRow.push(c);
                    colCounts[c]++;
                }
            }
            colsForThisRow.forEach(c => {
                let pool = cols[c];
                let val = pool[Math.floor(Math.random() * pool.length)];
                while (ticket[0][c] === val || ticket[1][c] === val) {
                    val = pool[Math.floor(Math.random() * pool.length)];
                }
                ticket[r][c] = val;
            });
        }

        for (let c = 0; c < 9; c++) {
            let vals = [];
            for (let r = 0; r < 3; r++) if (ticket[r][c] !== 0) vals.push(ticket[r][c]);
            vals.sort((a, b) => a - b);
            let vIdx = 0;
            for (let r = 0; r < 3; r++) if (ticket[r][c] !== 0) ticket[r][c] = vals[vIdx++];
        }
        valid = true;
    }
    return ticket;
}

export default function ExploreScreen() {
    const { currentTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'tickets' | 'history'>('tickets');
    const [history, setHistory] = useState<GameHistoryEntry[]>([]);
    const [tickets, setTickets] = useState<number[][][]>([]);
    const [markedCells, setMarkedCells] = useState<Set<string>>(new Set());

    useFocusEffect(
        React.useCallback(() => {
            loadHistory();
        }, [])
    );

    const loadHistory = async () => {
        try {
            const h = await AsyncStorage.getItem('@tambola_history');
            if (h) setHistory(JSON.parse(h));
        } catch (e) { }
    };

    const handleGenerateTickets = (count: number) => {
        const newTickets = [];
        for (let i = 0; i < count; i++) {
            newTickets.push(generateTicket());
        }
        setTickets(newTickets);
        setMarkedCells(new Set());
    };

    const toggleCell = (ticketIdx: number, rIdx: number, cIdx: number) => {
        const key = `${ticketIdx}-${rIdx}-${cIdx}`;
        setMarkedCells(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const clearMarks = () => {
        setMarkedCells(new Set());
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: currentTheme.background }]}>
            <View style={[styles.header, { backgroundColor: currentTheme.cardBg, borderBottomColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
                <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Tickets & History</Text>
            </View>

            {/* Segmented Control */}
            <View style={[styles.tabContainer, { backgroundColor: currentTheme.isDark ? '#0f0c1b' : '#f9f9f9' }]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        { backgroundColor: currentTheme.isDark ? '#1b1433' : '#e0e0e0' },
                        activeTab === 'tickets' && { backgroundColor: currentTheme.primary }
                    ]}
                    onPress={() => setActiveTab('tickets')}
                >
                    <Text style={[styles.tabText, { color: currentTheme.textLight }, activeTab === 'tickets' && { color: '#fff' }]}>Tickets</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        { backgroundColor: currentTheme.isDark ? '#1b1433' : '#e0e0e0' },
                        activeTab === 'history' && { backgroundColor: currentTheme.primary }
                    ]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabText, { color: currentTheme.textLight }, activeTab === 'history' && { color: '#fff' }]}>History</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'tickets' ? (
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.title, { color: currentTheme.text }]}>Tambola Ticket Generator</Text>
                    <Text style={[styles.subtitle, { color: currentTheme.textLight }]}>Generate valid Tambola tickets instantly.</Text>

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={[styles.genBtn, { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }]} onPress={() => handleGenerateTickets(1)}>
                            <Text style={[styles.genBtnText, { color: currentTheme.primary }]}>+ 1 Ticket</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.genBtn, { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }]} onPress={() => handleGenerateTickets(2)}>
                            <Text style={[styles.genBtnText, { color: currentTheme.primary }]}>+ 2 Tickets</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.genBtn, { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }]} onPress={() => handleGenerateTickets(3)}>
                            <Text style={[styles.genBtnText, { color: currentTheme.primary }]}>+ 3 Tickets</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.btnRow}>
                        <TouchableOpacity style={[styles.genBtn, { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }]} onPress={() => handleGenerateTickets(4)}>
                            <Text style={[styles.genBtnText, { color: currentTheme.primary }]}>+ 4 Tickets</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.genBtn, { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }]} onPress={() => handleGenerateTickets(5)}>
                            <Text style={[styles.genBtnText, { color: currentTheme.primary }]}>+ 5 Tickets</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.genBtn, { backgroundColor: currentTheme.secondary, borderColor: currentTheme.primary }]} onPress={() => handleGenerateTickets(6)}>
                            <Text style={[styles.genBtnText, { color: currentTheme.primary }]}>+ 6 Tickets</Text>
                        </TouchableOpacity>
                    </View>

                    {tickets.length > 0 && (
                        <TouchableOpacity style={styles.clearBtn} onPress={clearMarks}>
                            <Text style={styles.clearBtnText}>Clear Marks</Text>
                        </TouchableOpacity>
                    )}

                    {tickets.map((t, idx) => (
                        <View key={idx} style={[styles.ticketCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.isDark ? '#2a1f49' : '#eee' }]}>
                            <View style={[styles.ticketHeader, { backgroundColor: currentTheme.primary }]}>
                                <Text style={styles.ticketTitle}>Ticket #{idx + 1}</Text>
                            </View>
                            <View style={[styles.ticketGrid, { backgroundColor: currentTheme.cardBg }]}>
                                {t.map((row, rIdx) => (
                                    <View key={rIdx} style={[styles.ticketRow, { borderColor: currentTheme.isDark ? '#2a1f49' : '#eee' }]}>
                                        {row.map((cell, cIdx) => {
                                            const isMarked = markedCells.has(`${idx}-${rIdx}-${cIdx}`);
                                            return (
                                                <TouchableOpacity
                                                    key={cIdx}
                                                    style={[
                                                        styles.ticketCell,
                                                        { borderColor: currentTheme.isDark ? '#2a1f49' : '#eee' },
                                                        cell === 0 && { backgroundColor: currentTheme.isDark ? '#110c22' : '#f5f5f5' },
                                                        isMarked && { backgroundColor: currentTheme.isDark ? '#13351d' : '#a5d6a7' }
                                                    ]}
                                                    onPress={() => { if (cell > 0) toggleCell(idx, rIdx, cIdx); }}
                                                    activeOpacity={cell > 0 ? 0.7 : 1}
                                                >
                                                    <Text style={[
                                                        styles.ticketCellText,
                                                        { color: currentTheme.text },
                                                        isMarked && { color: currentTheme.isDark ? '#66bb6a' : '#1b5e20', textDecorationLine: 'line-through' }
                                                    ]}>
                                                        {cell > 0 ? cell : ''}
                                                    </Text>
                                                </TouchableOpacity>
                                            )
                                        })}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {tickets.length > 0 && <View style={{ height: 50 }} />}
                </ScrollView>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.historyContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyStateTitle, { color: currentTheme.text }]}>No games played yet</Text>
                            <Text style={[styles.emptyStateText, { color: currentTheme.textLight }]}>Complete a game to see your history here.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.historyCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.isDark ? '#2a1f49' : '#f0f0f0' }]}>
                            <Text style={[styles.historyDate, { color: currentTheme.text }]}>{formatDate(item.date)}</Text>
                            <View style={styles.historyRow}>
                                <Text style={[styles.historyLabel, { color: currentTheme.textLight }]}>Numbers Called:</Text>
                                <Text style={[styles.historyValue, { color: currentTheme.text }]}>{item.numbersCalled}/90</Text>
                            </View>
                            <View style={styles.historyRow}>
                                <Text style={[styles.historyLabel, { color: currentTheme.textLight }]}>Time Taken:</Text>
                                <Text style={[styles.historyValue, { color: currentTheme.text }]}>{formatTime(item.durationSeconds)}</Text>
                            </View>
                            <View style={styles.historyRow}>
                                <Text style={[styles.historyLabel, { color: currentTheme.textLight }]}>Settings:</Text>
                                <Text style={[styles.historyValue, { color: currentTheme.text }]}>{item.mode.toUpperCase()} • {item.speed.toUpperCase()}</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const { width } = Dimensions.get('window');
const cellWidth = Math.floor((width - 40 - 16) / 9);

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#111' },
    tabContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#f9f9f9', gap: 10 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, backgroundColor: '#e0e0e0' },
    activeTab: { backgroundColor: '#1976d2' },
    tabText: { fontWeight: '700', color: '#555' },
    activeTabText: { color: '#fff' },
    content: { padding: 20 },
    historyContent: { padding: 20 },
    title: { fontSize: 20, fontWeight: '800', marginBottom: 4, color: '#111' },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    btnRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    genBtn: { flex: 1, backgroundColor: '#e3f2fd', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bbdefb' },
    genBtnText: { color: '#1976d2', fontWeight: '800', fontSize: 14 },
    clearBtn: { backgroundColor: '#ffebee', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#ffcdd2' },
    clearBtnText: { color: '#d32f2f', fontWeight: '800', fontSize: 14 },
    ticketCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    ticketHeader: { backgroundColor: '#ef5350', padding: 8, alignItems: 'center' },
    ticketTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
    ticketGrid: { padding: 8, backgroundColor: '#fcfcfc' },
    ticketRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee' },
    ticketCell: { width: cellWidth, height: cellWidth * 1.2, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#eee' },
    ticketCellEmpty: { backgroundColor: '#f5f5f5' },
    ticketCellMarked: { backgroundColor: '#a5d6a7' },
    ticketCellText: { fontSize: 16, fontWeight: '800', color: '#111' },
    ticketCellTextMarked: { color: '#1b5e20', textDecorationLine: 'line-through' },
    historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
    historyDate: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 8 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    historyLabel: { color: '#666', fontSize: 14 },
    historyValue: { fontWeight: '700', color: '#333', fontSize: 14 },
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyStateTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8 },
    emptyStateText: { color: '#666', textAlign: 'center' },
});
