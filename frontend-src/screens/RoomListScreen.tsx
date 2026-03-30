
import React from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Room = {
  id: number;
  name: string;
  occupiedCount: number;
  totalSlots: number;
};

const mockRooms: Room[] = [
  { id: 1, name: 'Flower Room A', occupiedCount: 8, totalSlots: 12 },
  { id: 2, name: 'Flower Room B', occupiedCount: 10, totalSlots: 12 },
  { id: 3, name: 'Veg Room 1', occupiedCount: 6, totalSlots: 16 },
  { id: 4, name: 'Mother Room', occupiedCount: 4, totalSlots: 8 },
];

export default function RoomsListScreen() {
  const handleOpenRoom = (room: Room) => {
    Alert.alert('Open Room', `Open ${room.name} room map here.`);
  };

  const handleAddRoom = () => {
    Alert.alert('Add Room', 'Add Room flow goes here.');
  };

  const renderRoom = ({ item }: { item: Room }) => {
    const occupancyPercent = Math.round((item.occupiedCount / item.totalSlots) * 100);

    return (
      <Pressable
        onPress={() => handleOpenRoom(item)}
        style={({ pressed }) => [
          styles.roomCard,
          pressed && styles.roomCardPressed,
        ]}
      >
        <View style={styles.roomHeader}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.openText}>Open</Text>
        </View>

        <Text style={styles.roomStats}>
          {item.occupiedCount} occupied / {item.totalSlots} total slots
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${occupancyPercent}%` }]} />
        </View>

        <Text style={styles.percentText}>{occupancyPercent}% occupied</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Rooms</Text>
          <Text style={styles.subtitle}>
            Select a grow room to view the map and manage plants.
          </Text>
        </View>

        <FlatList
          data={mockRooms}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRoom}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <Pressable style={styles.addButton} onPress={handleAddRoom}>
          <Text style={styles.addButtonText}>Add Room</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#cbd5e1',
  },
  listContent: {
    paddingBottom: 16,
  },
  roomCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  roomCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  openText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ade80',
  },
  roomStats: {
    marginTop: 10,
    fontSize: 14,
    color: '#cbd5e1',
  },
  progressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  percentText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  addButton: {
    marginTop: 'auto',
    backgroundColor: '#22c55e',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '800',
  },
});
export default RoomListScreen;
