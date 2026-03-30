
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type PlantStatus = 'active' | 'harvested' | 'destroyed';
type SlotStatus = 'empty' | 'occupied' | 'harvested' | 'destroyed';

type Plant = {
  id: number;
  tagNumber: string;
  strainName?: string;
  status: PlantStatus;
};

type Slot = {
  id: number;
  row: number;
  column: number;
  slotLabel: string;
  status: SlotStatus;
  plant?: Plant;
};

const TOTAL_COLUMNS = 4;
const ROOM_NAME = 'Flower Room A';

const createMockSlots = (): Slot[] => {
  const plants: Plant[] = [
    { id: 1, tagNumber: '1A4060300002191000001234', strainName: 'Diesel Cake #3', status: 'active' },
    { id: 2, tagNumber: '1A4060300002191000001235', strainName: 'Velvet Sherblato #1', status: 'active' },
    { id: 3, tagNumber: '1A4060300002191000001236', strainName: 'OMF Gelato #3A', status: 'active' },
    { id: 4, tagNumber: '1A4060300002191000001237', strainName: 'Diesel Cake #4', status: 'active' },
    { id: 5, tagNumber: '1A4060300002191000001238', strainName: 'Velvet Sherblato #2', status: 'active' },
    { id: 6, tagNumber: '1A4060300002191000001239', strainName: 'Diesel Cake #5', status: 'active' },
    { id: 7, tagNumber: '1A4060300002191000001240', strainName: 'OMF Gelato #4', status: 'active' },
    { id: 8, tagNumber: '1A4060300002191000001241', strainName: 'Sherb Cross', status: 'active' },
  ];

  const labels = [
    'A1', 'A2', 'A3', 'A4',
    'B1', 'B2', 'B3', 'B4',
    'C1', 'C2', 'C3', 'C4',
  ];

  return labels.map((label, index) => {
    const row = Math.floor(index / TOTAL_COLUMNS) + 1;
    const column = (index % TOTAL_COLUMNS) + 1;
    const plant = plants[index];

    if (!plant) {
      return {
        id: index + 1,
        row,
        column,
        slotLabel: label,
        status: 'empty',
      };
    }

    return {
      id: index + 1,
      row,
      column,
      slotLabel: label,
      status: 'occupied',
      plant,
    };
  });
};

export default function RoomMapScreen() {
  const [slots, setSlots] = useState<Slot[]>(createMockSlots());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);

  const occupiedCount = useMemo(
    () => slots.filter((slot) => slot.status === 'occupied').length,
    [slots]
  );

  const handleSlotPress = (slot: Slot) => {
    if (slot.status === 'empty') {
      Alert.alert('Empty Slot', `${slot.slotLabel} is empty. Add Plant flow goes here.`);
      return;
    }

    setSelectedSlot(slot);
    setActionMenuVisible(true);
  };

  const closeMenu = () => {
    setActionMenuVisible(false);
    setSelectedSlot(null);
  };

  const movePlant = () => {
    if (!selectedSlot?.plant) return;

    const destination = slots.find((slot) => slot.status === 'empty');
    if (!destination) {
      Alert.alert('No Empty Slot', 'There are no empty slots available.');
      return;
    }

    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === selectedSlot.id) {
          return {
            ...slot,
            status: 'empty',
            plant: undefined,
          };
        }

        if (slot.id === destination.id) {
          return {
            ...slot,
            status: 'occupied',
            plant: selectedSlot.plant,
          };
        }

        return slot;
      })
    );

    closeMenu();
  };

  const harvestPlant = () => {
    if (!selectedSlot?.plant) return;

    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === selectedSlot.id) {
          return {
            ...slot,
            status: 'empty',
            plant: undefined,
          };
        }
        return slot;
      })
    );

    closeMenu();
    Alert.alert('Harvested', `${selectedSlot.plant.tagNumber} marked as harvested.`);
  };

  const destroyPlant = () => {
    if (!selectedSlot?.plant) return;

    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === selectedSlot.id) {
          return {
            ...slot,
            status: 'empty',
            plant: undefined,
          };
        }
        return slot;
      })
    );

    closeMenu();
    Alert.alert('Destroyed', `${selectedSlot.plant.tagNumber} marked as destroyed.`);
  };

  const showDetails = () => {
    if (!selectedSlot?.plant) return;

    Alert.alert(
      'Plant Details',
      [
        `Slot: ${selectedSlot.slotLabel}`,
        `Tag: ${selectedSlot.plant.tagNumber}`,
        `Strain: ${selectedSlot.plant.strainName ?? 'N/A'}`,
        `Status: ${selectedSlot.plant.status}`,
      ].join('\n')
    );
  };

  const renderSlot = ({ item }: ListRenderItemInfo<Slot>) => {
    const isEmpty = item.status === 'empty';

    return (
      <Pressable
        onPress={() => handleSlotPress(item)}
        style={({ pressed }) => [
          styles.slotCard,
          isEmpty ? styles.slotEmpty : styles.slotOccupied,
          pressed && styles.slotPressed,
        ]}
      >
        <Text style={styles.slotLabel}>{item.slotLabel}</Text>

        {isEmpty ? (
          <Text style={styles.emptyText}>Empty</Text>
        ) : (
          <>
            <Text style={styles.tagText} numberOfLines={2}>
              {item.plant?.tagNumber}
            </Text>
            <Text style={styles.strainText} numberOfLines={2}>
              {item.plant?.strainName ?? 'Unknown Strain'}
            </Text>
          </>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{ROOM_NAME}</Text>
            <Text style={styles.subtitle}>
              {occupiedCount} occupied / {slots.length} total slots
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <Pressable style={styles.headerButton} onPress={() => Alert.alert('Refresh', 'Room data refreshed.')}>
              <Text style={styles.headerButtonText}>Refresh</Text>
            </Pressable>

            <Pressable style={styles.headerButton} onPress={() => Alert.alert('Scan Tag', 'Scan Tag flow goes here.')}>
              <Text style={styles.headerButtonText}>Scan Tag</Text>
            </Pressable>
          </View>
        </View>

        <FlatList
          data={slots}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSlot}
          numColumns={TOTAL_COLUMNS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />

        <Pressable
          style={styles.addPlantButton}
          onPress={() => Alert.alert('Add Plant', 'Add Plant flow goes here.')}
        >
          <Text style={styles.addPlantButtonText}>Add Plant</Text>
        </Pressable>

        <Modal
          visible={actionMenuVisible}
          transparent
          animationType="slide"
          onRequestClose={closeMenu}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Plant Actions</Text>

              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Slot</Text>
                <Text style={styles.detailValue}>{selectedSlot?.slotLabel}</Text>
              </View>

              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Tag</Text>
                <Text style={styles.detailValue}>{selectedSlot?.plant?.tagNumber}</Text>
              </View>

              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Strain</Text>
                <Text style={styles.detailValue}>{selectedSlot?.plant?.strainName ?? 'N/A'}</Text>
              </View>

              <View style={styles.actionList}>
                <Pressable style={styles.actionButton} onPress={movePlant}>
                  <Text style={styles.actionButtonText}>Move</Text>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={harvestPlant}>
                  <Text style={styles.actionButtonText}>Harvest</Text>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={destroyPlant}>
                  <Text style={styles.actionButtonText}>Destroy</Text>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={showDetails}>
                  <Text style={styles.actionButtonText}>Details</Text>
                </Pressable>

                <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={closeMenu}>
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#0f172a',
  },
  header: {
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#cbd5e1',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  headerButtonText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  grid: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slotCard: {
    width: '23%',
    minHeight: 112,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  slotEmpty: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  slotOccupied: {
    backgroundColor: '#14532d',
    borderColor: '#4ade80',
  },
  slotPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  tagText: {
    fontSize: 11,
    color: '#f8fafc',
    fontWeight: '700',
  },
  strainText: {
    fontSize: 10,
    color: '#dcfce7',
  },
  addPlantButton: {
    marginTop: 'auto',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#22c55e',
  },
  addPlantButtonText: {
    color: '#052e16',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  detailBlock: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '600',
  },
  actionList: {
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  actionButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 15,
  },
});
export default RoomMapScreen;
