import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  addPlant,
  getPlant,
  deletePlant,
  Plant,
} from '../../../../store/plantStore';
import { getRoom, Room } from '../../../../store/roomStore';
import { addActivityLogEntry } from '../../../../store/activityLogStore';

export default function SlotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const roomId = String(params.id);
  const slotId = String(params.slotId);
  const scannedTag = typeof params.scannedTag === 'string' ? params.scannedTag : '';

  const [room, setRoom] = useState<Room | null>(null);
  const [tag, setTag] = useState('');
  const [strain, setStrain] = useState('');

  const loadSlotData = async () => {
    const foundRoom = await getRoom(roomId);
    setRoom(foundRoom ?? null);

    const plant: Plant | undefined = await getPlant(roomId, slotId);

    if (plant) {
      setTag(plant.tag);
      setStrain(plant.strain);
    } else {
      setTag(scannedTag || '');
      setStrain('');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSlotData();
    }, [roomId, slotId, scannedTag])
  );

  useEffect(() => {
    if (scannedTag) {
      setTag(scannedTag);
    }
  }, [scannedTag]);

  const handleSave = async () => {
    if (!tag.trim() || !strain.trim()) {
      Alert.alert('Missing info', 'Please enter both tag and strain.');
      return;
    }

    await addPlant({
      roomId,
      slotId,
      tag: tag.trim(),
      strain: strain.trim(),
    });

    await addActivityLogEntry({
      action: 'save_plant',
      roomId,
      roomName: room?.name,
      slotId,
      tag: tag.trim(),
      strain: strain.trim(),
      details: 'Plant saved or updated in slot.',
    });

    router.back();
  };

  const clearSlotWithLog = async (
    actionType: 'clear_slot' | 'harvest_plant' | 'destroy_plant'
  ) => {
    const existingPlant = await getPlant(roomId, slotId);

    await deletePlant(roomId, slotId);

    await addActivityLogEntry({
      action: actionType,
      roomId,
      roomName: room?.name,
      slotId,
      tag: existingPlant?.tag,
      strain: existingPlant?.strain,
      details:
        actionType === 'clear_slot'
          ? 'Plant removed and slot cleared.'
          : actionType === 'harvest_plant'
            ? 'Plant marked harvested and slot cleared.'
            : 'Plant marked destroyed and slot cleared.',
    });

    router.back();
  };

  const handleActions = () => {
    Alert.alert('Plant Actions', 'Choose an action for this plant.', [
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
        text: 'Scan Tag',
        onPress: () => {
          router.push({
            pathname: '/scan',
            params: {
              roomId,
              slotId,
            },
          });
        },
      },
      {
        text: 'Harvest Plant',
        onPress: () => {
          Alert.alert('Harvest Plant', 'Mark this plant as harvested and clear the slot?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Harvest',
              style: 'destructive',
              onPress: () => {
                clearSlotWithLog('harvest_plant');
              },
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
              onPress: () => {
                clearSlotWithLog('destroy_plant');
              },
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
              onPress: () => {
                clearSlotWithLog('clear_slot');
              },
            },
          ]);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const hasPlant = tag.trim().length > 0 || strain.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {room ? room.name : 'Room'} - Slot {slotId}
      </Text>

      <Text style={styles.label}>Plant Tag</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter tag number"
        value={tag}
        onChangeText={setTag}
      />

      <Text style={styles.label}>Strain</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter strain name"
        value={strain}
        onChangeText={setStrain}
      />

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Plant</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() =>
          router.push({
            pathname: '/scan',
            params: {
              roomId,
              slotId,
            },
          })
        }
      >
        <Text style={styles.secondaryButtonText}>Scan Tag</Text>
      </Pressable>

      {hasPlant ? (
        <Pressable style={styles.actionsButton} onPress={handleActions}>
          <Text style={styles.actionsButtonText}>Actions</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#e5e5e5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsButton: {
    backgroundColor: '#1f7a1f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionsButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
