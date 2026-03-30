import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Slot } from '../types/Slot';

type Props = {
  slot: Slot;
  onPress: (slot: Slot) => void;
};

const getBackgroundColor = (status: Slot['status']): string => {
  switch (status) {
    case 'occupied':
      return '#22c55e'; // green
    case 'harvested':
      return '#facc15'; // yellow
    case 'destroyed':
      return '#ef4444'; // red
    case 'empty':
    default:
      return '#374151'; // dark gray
  }
};

const SlotCell: React.FC<Props> = ({ slot, onPress }) => {
  const backgroundColor = getBackgroundColor(slot.status);

  return (
    <Pressable
      style={[styles.cell, { backgroundColor }]}
      onPress={() => onPress(slot)}
    >
      {slot.status !== 'empty' && slot.plantId && (
        <Text style={styles.text}>{slot.plantId}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    aspectRatio: 1,
    flex: 1,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  } as ViewStyle,
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SlotCell;
