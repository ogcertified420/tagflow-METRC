import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { findPlantsByLastFour } from '../store/plantStore';
import { getRoom } from '../store/roomStore';

type SearchResult = {
  roomId: string;
  roomName: string;
  slotId: string;
  tag: string;
  lastFour?: string;
  strain: string;
};

export default function GrowGpsScreen() {
  const router = useRouter();
  const [lastFourInput, setLastFourInput] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const cleaned = lastFourInput.replace(/\D/g, '').slice(-4);
    setSearched(true);

    if (!cleaned) {
      setResults([]);
      return;
    }

    const matches = await findPlantsByLastFour(cleaned);
    const hydrated = await Promise.all(
      matches.map(async (plant) => {
        const room = await getRoom(plant.roomId);
        return {
          roomId: plant.roomId,
          roomName: room?.name ?? 'Unknown room',
          slotId: plant.slotId,
          tag: plant.tag,
          lastFour: plant.lastFour,
          strain: plant.strain,
        };
      })
    );

    setResults(hydrated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Grow GPS</Text>
      <Text style={styles.subtitle}>Find a plant by the last 4 digits of its tag.</Text>

      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="Enter last 4"
        value={lastFourInput}
        onChangeText={setLastFourInput}
        maxLength={8}
      />

      <Pressable style={styles.searchButton} onPress={() => void handleSearch()}>
        <Text style={styles.searchButtonText}>Find Plant</Text>
      </Pressable>

      {results.map((result, index) => (
        <Pressable
          key={`${result.roomId}-${result.slotId}-${index}`}
          style={styles.resultCard}
          onPress={() =>
            router.push({
              pathname: '/room/[id]',
              params: { id: result.roomId },
            })
          }
        >
          <Text style={styles.resultTitle}>{result.roomName}</Text>
          <Text style={styles.resultText}>Slot: {result.slotId}</Text>
          <Text style={styles.resultText}>Tag: {result.lastFour ? `...${result.lastFour}` : result.tag}</Text>
          <Text style={styles.resultText}>Strain: {result.strain}</Text>
        </Pressable>
      ))}

      {searched && results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No plant found with those last 4 digits.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f7f7f7',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  searchButton: {
    backgroundColor: '#1769aa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
  },
  searchButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  resultText: {
    color: '#444',
    marginBottom: 4,
  },
  emptyState: {
    marginTop: 10,
  },
  emptyText: {
    color: '#666',
  },
});
