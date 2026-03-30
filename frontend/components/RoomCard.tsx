import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Room } from '../types/Room';

type Props = {
  room: Room;
  onPress: (room: Room) => void;
};

const RoomCard: React.FC<Props> = ({ room, onPress }) => {
  const capacity = room.rows * room.columns;
  const percent = capacity > 0 ? Math.round((room.plantCount / capacity) * 100) : 0;

  return (
    <Pressable style={styles.card} onPress={() => onPress(room)}>
      <Text style={styles.name}>{room.name}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Plants:</Text>
        <Text style={styles.value}>{room.plantCount}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Capacity:</Text>
        <Text style={styles.value}>{percent}%</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  name: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
  },
  value: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RoomCard;
