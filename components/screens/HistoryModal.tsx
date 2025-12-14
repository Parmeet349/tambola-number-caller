// components/screens/HistoryModal.tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../app/(tabs)/index';

type Props = NativeStackScreenProps<RootStackParamList, 'HistoryModal'>;

const HistoryModal: React.FC<Props> = ({ route }) => {
  const { historySnapshot } = route.params ?? { historySnapshot: [] as number[] };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Called Numbers</Text>
      <FlatList
        data={historySnapshot}
        keyExtractor={(item, idx) => `${item}-${idx}`}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.index}>{historySnapshot.length - index}.</Text>
            <Text style={styles.num}>{item}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

export default HistoryModal;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#eee' },
  index: { width: 36, color: '#666' },
  num: { fontWeight: '700' }
});
