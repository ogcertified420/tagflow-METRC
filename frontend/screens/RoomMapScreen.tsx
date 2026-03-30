import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPlantsByRoom } from '../store/plantStore';

type PlantStatus = 'active' | 'harvested' | 'destroyed';
type SlotStatus = 'empty' | 'occupied';

type Plant = {
  id: number;
  tagNumber: string;
  strainName?: string;
  status: PlantStatus;
  slotId: number;
  roomId?: string;
};

type Slot = {
  id: number;
  row: number;
  column: number;
  slotLabel: string;
  status: SlotStatus;
  plant?: Plant;
};

function toSafePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function buildSlotLabel(rowIndex: number, columnIndex: number) {
  const rowLetter = String.fromCharCode(65 + rowIndex);
  return `${rowLetter}${columnIndex + 1}`;
}

function buildSlots(plants: Plant[], rows: number, columns: number): Slot[] {
  const slots: Slot[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const slotId = row * columns + col + 1;
      const slotLabel = buildSlotLabel(row, col);
      const plant = plants.find(
        (p) => p.slotId === slotId && p.status === 'active'
      );

      slots.push({
        id: slotId,
        row: row + 1,
        column: col + 1,
        slotLabel,
        status: plant ? 'occupied' : 'empty',
        plant,
      });
    }
  }

  return slots;
}

export default function RoomMapScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    rows?: string;
    columns?: string;
  }>();

  const roomId = String(params.id ?? '');
  const roomName = String(params.name ?? 'Room Map');
  const totalRows = toSafePositiveInt(params.rows, 3);
  const totalColumns = toSafePositiveInt(params.columns, 4);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [plantToMove, setPlantToMove] = useState<Plant | null>(null);
  const [moveFromSlotLabel, setMoveFromSlotLabel] = useState<string>('');

  const slots = useMemo(() => {
    return buildSlots(plants, totalRows, totalColumns);
  }, [plants, totalRows, totalColumns]);

  const occupiedCount = useMemo(() => {
    return slots.filter((slot) => slot.status === 'occupied').length;
  }, [slots]);

  const loadPlants = useCallback(async () => {
    try {
      const savedPlants = await getPlantsByRoom(roomId);
      const safePlants = Array.isArray(savedPlants) ? savedPlants : [];
      setPlants(safePlants);
    } catch (error) {
      console.error('Failed to load plants:', error);
      setPlants([]);
    }
  }, [roomId]);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  const closeMenu = () => {
    setActionMenuVisible(false);
    setSelectedSlot(null);
  };

  const exitMoveMode = () => {
    setMoveMode(false);
    setPlantToMove(null);
    setMoveFromSlotLabel('');
  };

  const openOccupiedSlotMenu = (slot: Slot) => {
    setSelectedSlot(slot);
    setActionMenuVisible(true);
  };

  const openEmptySlotMenu = (slot: Slot) => {
    Alert.alert(
      `Empty Slot ${slot.slotLabel}`,
      'Choose what you want to do.',
      [
        {
          text: 'Add Plant Here',
          onPress: () =>
            Alert.alert(
              'Add Plant Here',
              `Connect this to your add-plant flow for ${slot.slotLabel}.`
            ),
        },
        {
          text: 'Start Auto Add Here',
          onPress: () =>
            Alert.alert(
              'Start Auto Add',
              `Connect auto add so it starts at ${slot.slotLabel}.`
            ),
        },
        {
          text: 'Resume Auto Add Here',
          onPress: () =>
            Alert.alert(
              'Resume Auto Add',
              `Connect resume auto add so it continues from ${slot.slotLabel}.`
            ),
        },
        {
          text: 'Scan Into This Slot',
          onPress: () =>
            Alert.alert(
              'Scan Into Slot',
              `Connect scanner flow to place the next scanned plant into ${slot.slotLabel}.`
            ),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const movePlantToSlot = (destinationSlot: Slot) => {
    if (!plantToMove) return;

    if (destinationSlot.status !== 'empty') {
      Alert.alert(
        'Slot Occupied',
        `${destinationSlot.slotLabel} already has a plant in it.`
      );
      return;
    }

    setPlants((prevPlants) =>
      prevPlants.map((plant) =>
        plant.id === plantToMove.id ? { ...plant, slotId: destinationSlot.id } : plant
      )
    );

    Alert.alert(
      'Plant Moved',
      `${plantToMove.tagNumber} moved from ${moveFromSlotLabel} to ${destinationSlot.slotLabel}.`
    );

    exitMoveMode();
  };

  const handleSlotPress = (slot: Slot) => {
    if (moveMode) {
      movePlantToSlot(slot);
      return;
    }

    if (slot.status === 'empty') {
      openEmptySlotMenu(slot);
      return;
    }

    openOccupiedSlotMenu(slot);
  };

  const beginMoveMode = () => {
    if (!selectedSlot?.plant) return;

    const emptySlotCount = slots.filter((slot) => slot.status === 'empty').length;
    if (emptySlotCount === 0) {
      Alert.alert('No Empty Slot', 'There are no empty slots available.');
      return;
    }

    setPlantToMove(selectedSlot.plant);
    setMoveFromSlotLabel(selectedSlot.slotLabel);
    closeMenu();
    setMoveMode(true);

    Alert.alert(
      'Select Destination',
      `Tap the empty slot where you want to move ${selectedSlot.plant.tagNumber}.`
    );
  };

  const harvestPlant = () => {
    if (!selectedSlot?.plant) return;

    Alert.alert(
      'Harvest Plant',
      `Mark ${selectedSlot.plant.tagNumber} as harvested?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Harvest',
          style: 'destructive',
          onPress: () => {
            setPlants((prevPlants) =>
              prevPlants.map((plant) =>
                plant.id === selectedSlot.plant!.id
                  ? { ...plant, status: 'harvested' }
                  : plant
              )
            );

            const tag = selectedSlot.plant!.tagNumber;
            closeMenu();
            Alert.alert('Harvested', `${tag} marked as harvested.`);
          },
        },
      ]
    );
  };

  const destroyPlant = () => {
    if (!selectedSlot?.plant) return;

    Alert.alert(
      'Destroy Plant',
      `Mark ${selectedSlot.plant.tagNumber} as destroyed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Destroy',
          style: 'destructive',
          onPress: () => {
            setPlants((prevPlants) =>
              prevPlants.map((plant) =>
                plant.id === selectedSlot.plant!.id
                  ? { ...plant, status: 'destroyed' }
                  : plant
              )
            );

            const tag = selectedSlot.plant!.tagNumber;
            closeMenu();
            Alert.alert('Destroyed', `${tag} marked as destroyed.`);
          },
        },
      ]
    );
  };

  const showDetails = () => {
    if (!selectedSlot?.plant) return;

    Alert.alert(
      'Plant Details',
      [
        `Room: ${roomName}`,
        `Slot: ${selectedSlot.slotLabel}`,
        `Tag: ${selectedSlot.plant.tagNumber}`,
        `Strain: ${selectedSlot.plant.strainName ?? 'N/A'}`,
        `Status: ${selectedSlot.plant.status}`,
        `Plant ID: ${selectedSlot.plant.id}`,
      ].join('\n')
    );
  };

  const cancelMoveMode = () => {
    exitMoveMode();
    Alert.alert('Move Cancelled', 'Plant move mode has been cancelled.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{roomName}</Text>
              <Text style={styles.subtitle}>
                {occupiedCount} occupied / {slots.length} total slots
              </Text>
              <Text style={styles.metaText}>
                {totalRows} rows × {totalColumns} columns
              </Text>
            </View>

            <View style={styles.headerButtons}>
              <Pressable style={styles.headerButton} onPress={loadPlants}>
                <Text style={styles.headerButtonText}>Refresh</Text>
              </Pressable>

              <Pressable
                style={styles.headerButton}
                onPress={() =>
                  Alert.alert(
                    'Scanner',
                    'Hook your scanner menu here: Auto Add / Manual Add / Resume Auto Add.'
                  )
                }
              >
                <Text style={styles.headerButtonText}>Scan Tag</Text>
              </Pressable>
            </View>
          </View>

          {moveMode ? (
            <View style={styles.moveBanner}>
              <View style={styles.moveBannerTextWrap}>
                <Text style={styles.moveBannerTitle}>Move Mode Active</Text>
                <Text style={styles.moveBannerText}>
                  Tap an empty slot for {plantToMove?.tagNumber ?? 'selected plant'}
                </Text>
              </View>

              <Pressable style={styles.moveCancelButton} onPress={cancelMoveMode}>
                <Text style={styles.moveCancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator>
          <ScrollView
            showsVerticalScrollIndicator
            contentContainerStyle={styles.grid}
          >
            {Array.from({ length: totalRows }).map((_, rowIndex) => {
              const rowSlots = slots.filter((slot) => slot.row === rowIndex + 1);

              return (
                <View key={`row-${rowIndex}`} style={styles.row}>
                  {rowSlots.map((slot) => {
                    const isEmpty = slot.status === 'empty';
                    const isMoveTarget =
                      moveMode && isEmpty && plantToMove !== null;

                    return (
                      <Pressable
                        key={slot.id}
                        onPress={() => handleSlotPress(slot)}
                        style={({ pressed }) => [
                          styles.slotCard,
                          isEmpty ? styles.slotEmpty : styles.slotOccupied,
                          isMoveTarget && styles.slotMoveTarget,
                          pressed && styles.slotPressed,
                        ]}
                      >
                        <Text style={styles.slotLabel}>{slot.slotLabel}</Text>

                        {isEmpty ? (
                          <>
                            <Text style={styles.emptyText}>Empty</Text>
                            {isMoveTarget ? (
                              <Text style={styles.helperText}>Tap to move here</Text>
                            ) : (
                              <Text style={styles.helperText}>Tap for options</Text>
                            )}
                          </>
                        ) : (
                          <>
                            <Text style={styles.tagText} numberOfLines={2}>
                              {slot.plant?.tagNumber}
                            </Text>
                            <Text style={styles.strainText} numberOfLines={2}>
                              {slot.plant?.strainName ?? 'Unknown Strain'}
                            </Text>
                            <Text style={styles.helperText}>Tap for actions</Text>
                          </>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </ScrollView>

        <Pressable
          style={styles.addPlantButton}
          onPress={() =>
            Alert.alert(
              'Add Plant',
              'Hook this button to your add plant or scanner flow.'
            )
          }
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
                <Text style={styles.detailLabel}>Room</Text>
                <Text style={styles.detailValue}>{roomName}</Text>
              </View>

              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Slot</Text>
                <Text style={styles.detailValue}>{selectedSlot?.slotLabel}</Text>
              </View>

              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Tag</Text>
                <Text style={styles.detailValue}>
                  {selectedSlot?.plant?.tagNumber ?? 'N/A'}
                </Text>
              </View>

              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Strain</Text>
                <Text style={styles.detailValue}>
                  {selectedSlot?.plant?.strainName ?? 'N/A'}
                </Text>
              </View>

              <View style={styles.actionList}>
                <Pressable style={styles.actionButton} onPress={beginMoveMode}>
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

                <Pressable
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={closeMenu}
                >
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
  headerTopRow: {
    gap: 12,
  },
  headerTextWrap: {
    gap: 2,
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
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
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
  moveBanner: {
    borderRadius: 14,
    backgroundColor: '#3b0764',
    borderWidth: 1,
    borderColor: '#a855f7',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  moveBannerTextWrap: {
    flex: 1,
  },
  moveBannerTitle: {
    color: '#faf5ff',
    fontSize: 15,
    fontWeight: '800',
  },
  moveBannerText: {
    color: '#e9d5ff',
    fontSize: 12,
    marginTop: 2,
  },
  moveCancelButton: {
    backgroundColor: '#581c87',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  moveCancelButtonText: {
    color: '#faf5ff',
    fontWeight: '700',
  },
  grid: {
    paddingBottom: 16,
    paddingRight: 24,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  slotCard: {
    width: 112,
    minHeight: 116,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    justifyContent: 'space-between',
    marginRight: 12,
  },
  slotEmpty: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  slotOccupied: {
    backgroundColor: '#14532d',
    borderColor: '#4ade80',
  },
  slotMoveTarget: {
    backgroundColor: '#1e1b4b',
    borderColor: '#818cf8',
  },
  slotPressed: {
    opacity: 0.82,
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
  helperText: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 6,
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
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  actionButtonText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
});
