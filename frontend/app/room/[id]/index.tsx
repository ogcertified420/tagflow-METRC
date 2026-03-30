import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { addActivityLogEntry } from '../../../store/activityLogStore';
import {
  deletePlant,
  getPlant,
  getPlantsByRoom,
  Plant,
} from '../../../store/plantStore';
import { getRoom, Room } from '../../../store/roomStore';

type SlotRow = {
  key: string;
  slotIds: string[];
};

export default function RoomMapScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const roomId = String(id);

  const [room, setRoom] = useState<Room | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoomData = async () => {
    setLoading(true);

    const [foundRoom, roomPlants] = await Promise.all([
      getRoom(roomId),
      getPlantsByRoom(roomId),
    ]);

    setRoom(foundRoom ?? null);
    setPlants(roomPlants);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadRoomData();
    }, [roomId])
  );

  const plantMap = useMemo(() => {
    const next = new Map<string, Plant>();
    plants.forEach((plant) => next.set(String(plant.slotId), plant));
    return next;
  }, [plants]);

  const slotRows = useMemo<SlotRow[]>(() => {
    if (!room) return [];

    if (room.layoutType === 'pattern') {
      let currentSlot = 1;
      return (room.pattern ?? []).map((count, rowIndex) => {
        const slotIds = Array.from({ length: count }, () => String(currentSlot++));
        return {
          key: `row-${rowIndex + 1}`,
          slotIds,
        };
      });
    }

    const rows = room.rows ?? 0;
    const columns = room.columns ?? 0;

    return Array.from({ length: rows }, (_, rowIndex) => {
      const slotIds = Array.from({ length: columns }, (_, colIndex) => {
        return String(rowIndex * columns + colIndex + 1);
      });

      return {
        key: `row-${rowIndex + 1}`,
        slotIds,
      };
    });
  }, [room]);

  const totalSlots = useMemo(
    () => slotRows.reduce((sum, row) => sum + row.slotIds.length, 0),
    [slotRows]
  );

  const occupiedCount = plants.length;
  const capacityPercent = totalSlots > 0 ? Math.round((occupiedCount / totalSlots) * 100) : 0;

  const handleOpenSlot = (slotId: string) => {
    router.push({
      pathname: '/room/[id]/slot/[slotId]',
      params: { id: roomId, slotId },
    });
  };

  const handleClearLikeAction = async (
    slotId: string,
    action: 'clear_slot' | 'harvest_plant' | 'destroy_plant'
  ) => {
    const plant = await getPlant(roomId, slotId);
    await deletePlant(roomId, slotId);

    await addActivityLogEntry({
      action,
      roomId,
      roomName: room?.name,
      slotId,
      tag: plant?.tag,
      strain: plant?.strain,
      details:
        action === 'clear_slot'
          ? 'Plant removed and slot cleared from room map.'
          : action === 'harvest_plant'
            ? 'Plant marked harvested and slot cleared from room map.'
            : 'Plant marked destroyed and slot cleared from room map.',
    });

    await loadRoomData();
  };

  const handleFilledSlotPress = (slotId: string, plant: Plant) => {
    Alert.alert(
      `Slot ${slotId}`,
      `${plant.lastFour ? `#${plant.lastFour} • ` : ''}${plant.strain}`,
      [
        {
          text: 'Edit Plant',
          onPress: () => handleOpenSlot(slotId),
        },
        {
          text: 'Move Plant',
          onPress: () => {
            router.push({
              pathname: '/move-plant',
              params: {
                sourceRoomId: roomId,
                sourceSlotId: slotId,
              },
            });
          },
        },
        {
          text: 'View History',
          onPress: () => router.push('/activity-log'),
        },
        {
          text: 'Harvest Plant',
          onPress: () => {
            Alert.alert('Harvest Plant', 'Mark this plant as harvested and clear the slot?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Harvest',
                style: 'destructive',
                onPress: () => handleClearLikeAction(slotId, 'harvest_plant'),
              },
            ]);
          },
        },
        {
          text: 'Destroy Plant',
          onPress: () => {
            Alert.alert('Destroy Plant', 'Mark this plant as destroyed and clear the slot?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Destroy',
                style: 'destructive',
                onPress: () => handleClearLikeAction(slotId, 'destroy_plant'),
              },
            ]);
          },
        },
        {
          text: 'Clear Slot',
          onPress: () => {
            Alert.alert('Clear Slot', 'Remove this plant and empty the slot?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: () => handleClearLikeAction(slotId, 'clear_slot'),
              },
            ]);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  if (!room && !loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Room not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{room?.name ?? 'Room Map'}</Text>
      <Text style={styles.roomMeta}>Layout: {room?.layoutType === 'grid' ? 'Grid' : 'Pattern'}</Text>
      {room?.layoutType === 'grid' ? (
        <Text style={styles.roomMeta}>
          {room.rows} x {room.columns}
        </Text>
      ) : (
        <Text style={styles.roomMeta}>Pattern: {room?.pattern?.join(', ')}</Text>
      )}

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Plants</Text>
          <Text style={styles.summaryValue}>{occupiedCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Capacity</Text>
          <Text style={styles.summaryValue}>{totalSlots}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Fill %</Text>
          <Text style={styles.summaryValue}>{capacityPercent}%</Text>
        </View>
      </View>

      {!!room?.strainKey?.length && (
        <View style={styles.keyCard}>
          <Text style={styles.keyTitle}>Strain Key</Text>
          <Text style={styles.keyText}>
            {room.strainKey.map((entry) => `${entry.key}=${entry.strain}`).join('   •   ')}
          </Text>
        </View>
      )}

      <Text style={styles.helperText}>
        Tap an empty slot to add or edit a plant. Tap a filled slot for actions.
      </Text>

      <View style={styles.topActionRow}>
        <Pressable
          style={styles.scannerButton}
          onPress={() =>
            router.push({
              pathname: '/scan',
              params: {
                roomId,
              },
            })
          }
        >
          <Text style={styles.scannerButtonText}>Scanner</Text>
        </Pressable>

        <Pressable style={styles.gpsButton} onPress={() => router.push('/grow-gps' as any)}>
          <Text style={styles.gpsButtonText}>Grow GPS</Text>
        </Pressable>

        <Pressable
          style={styles.historyButton}
          onPress={() => router.push('/activity-log')}
        >
          <Text style={styles.historyButtonText}>History</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.mapWrap}>
          {slotRows.map((row, rowIndex) => (
            <View key={row.key} style={styles.rowWrap}>
              <Text style={styles.rowLabel}>Row {rowIndex + 1}</Text>
              <View style={styles.rowSlots}>
                {row.slotIds.map((slotId) => {
                  const plant = plantMap.get(slotId);
                  const filled = Boolean(plant);

                  return (
                    <Pressable
                      key={slotId}
                      style={[styles.slotCard, filled ? styles.slotFilled : styles.slotEmpty]}
                      onPress={() =>
                        filled && plant
                          ? handleFilledSlotPress(slotId, plant)
                          : handleOpenSlot(slotId)
                      }
                    >
                      <Text style={styles.slotNumber}>#{slotId}</Text>
                      {plant ? (
                        <>
                          <Text style={styles.slotTag}>{plant.lastFour ? `Tag ${plant.lastFour}` : plant.tag}</Text>
                          <Text style={styles.slotStrain} numberOfLines={2}>{plant.strain}</Text>
                        </>
                      ) : (
                        <Text style={styles.slotEmptyText}>Empty</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#f7f7f7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  roomMeta: {
    color: '#666',
    marginBottom: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginTop: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: '#666',
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  keyCard: {
    backgroundColor: '#eef7ee',
    borderWidth: 1,
    borderColor: '#cfe7cf',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  keyTitle: {
    fontWeight: '800',
    marginBottom: 6,
  },
  keyText: {
    color: '#244724',
  },
  helperText: {
    color: '#666',
    marginBottom: 14,
  },
  topActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  scannerButton: {
    flex: 1,
    backgroundColor: '#1f7a1f',
    padding: 14,
    borderRadius: 12,
  },
  scannerButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  gpsButton: {
    flex: 1,
    backgroundColor: '#1769aa',
    padding: 14,
    borderRadius: 12,
  },
  gpsButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  historyButton: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    padding: 14,
    borderRadius: 12,
  },
  historyButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  mapWrap: {
    gap: 12,
    paddingBottom: 10,
  },
  rowWrap: {
    gap: 8,
  },
  rowLabel: {
    fontWeight: '700',
    color: '#444',
  },
  rowSlots: {
    flexDirection: 'row',
    gap: 10,
  },
  slotCard: {
    width: 108,
    minHeight: 90,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
  },
  slotFilled: {
    backgroundColor: '#dbf0db',
    borderColor: '#9fc49f',
  },
  slotEmpty: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  slotNumber: {
    fontWeight: '800',
    marginBottom: 6,
  },
  slotTag: {
    fontSize: 12,
    color: '#2a5a2a',
    marginBottom: 4,
    fontWeight: '700',
  },
  slotStrain: {
    fontSize: 12,
    color: '#1e1e1e',
  },
  slotEmptyText: {
    color: '#888',
    fontSize: 12,
  },
});
