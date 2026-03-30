import React from 'react';
import { FlatList, ListRenderItem } from 'react-native';
import { Slot } from '../types/Slot';
import SlotCell from './SlotCell';

type Props = {
  slots: Slot[];
  columns: number;
  onSlotPress: (slot: Slot) => void;
};

const SlotGrid: React.FC<Props> = ({ slots, columns, onSlotPress }) => {
  const renderItem: ListRenderItem<Slot> = ({ item }) => (
    <SlotCell slot={item} onPress={onSlotPress} />
  );

  return (
    <FlatList
      data={slots}
      keyExtractor={(item) => item.index.toString()}
      renderItem={renderItem}
      numColumns={columns}
      scrollEnabled={false}
    />
  );
};

export default SlotGrid;
