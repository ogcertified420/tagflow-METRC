import React, { useCallback, useState } from 'react';
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
  getRoom,
  updateRoom,
  parsePatternInput,
  parseStrainKeyInput,
  formatStrainKeyInput,
  Room,
} from '../../store/roomStore';
import { addActivityLogEntry } from '../../store/activityLogStore';

export default function EditRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roomId = String(params.id);

  const [room, setRoom] = useState<Room | null>(null);
  const [name, setName] = useState('');
  const [rows, setRows] = useState('');
  const [columns, setColumns] = useState('');
  const [pattern, setPattern] = useState('');
  const [strainKeyInput, setStrainKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadRoomData = async () => {
    const foundRoom = await getRoom(roomId);

    if (!foundRoom) {
      setRoom(null);
      return;
    }

    setRoom(foundRoom);
    setName(foundRoom.name ?? '');
    setStrainKeyInput(formatStrainKeyInput(foundRoom.strainKey));

    if (foundRoom.layoutType === 'grid') {
      setRows(String(foundRoom.rows ?? ''));
      setColumns(String(foundRoom.columns ?? ''));
      setPattern('');
    } else {
      setPattern((foundRoom.pattern ?? []).join(','));
      setRows('');
      setColumns('');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRoomData();
    }, [roomId])
  );

  const handleSave = async () => {
    if (!room) {
      Alert.alert('Room not found', 'Unable to load this room.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Missing room name', 'Please enter a room name.');
      return;
    }

    const parsedStrainKey = parseStrainKeyInput(strainKeyInput);
    if (strainKeyInput.trim().length > 0 && parsedStrainKey.length === 0) {
      Alert.alert('Invalid strain key', 'Use one line per strain like 1=Diesel Cake');
      return;
    }

    try {
      setIsSaving(true);

      if (room.layoutType === 'grid') {
        const rowCount = Number(rows);
        const columnCount = Number(columns);

        if (
          !Number.isFinite(rowCount) ||
          !Number.isFinite(columnCount) ||
          rowCount <= 0 ||
          columnCount <= 0
        ) {
          Alert.alert('Invalid grid', 'Enter valid rows and columns.');
          return;
        }

        const updatedRoom: Room = {
          ...room,
          name: name.trim(),
          rows: rowCount,
          columns: columnCount,
          strainKey: parsedStrainKey,
        };

        await updateRoom(updatedRoom);

        await addActivityLogEntry({
          action: 'create_room',
          roomId: room.id,
          roomName: updatedRoom.name,
          details: `Room updated to grid ${rowCount} x ${columnCount}. Strain key entries: ${parsedStrainKey.length}.`,
        });
      } else {
        const parsedPattern = parsePatternInput(pattern);

        if (parsedPattern.length === 0) {
          Alert.alert('Invalid pattern', 'Enter a pattern like 3,2,3,2');
          return;
        }

        const updatedRoom: Room = {
          ...room,
          name: name.trim(),
          pattern: parsedPattern,
          strainKey: parsedStrainKey,
        };

        await updateRoom(updatedRoom);

        await addActivityLogEntry({
          action: 'create_room',
          roomId: room.id,
          roomName: updatedRoom.name,
          details: `Room updated to pattern ${parsedPattern.join(', ')}. Strain key entries: ${parsedStrainKey.length}.`,
        });
      }

      router.back();
    } catch (error) {
      console.error('Failed to save room:', error);
      Alert.alert('Save failed', 'Something went wrong while saving the room.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!room) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Room not found</Text>
        <Pressable style={styles.secondaryButton} onPress={handleCancel}>
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Room</Text>

      <Text style={styles.label}>Room Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Room name"
      />

      <Text style={styles.meta}>
        Layout Type: {room.layoutType === 'grid' ? 'Grid' : 'Pattern'}
      </Text>

      {room.layoutType === 'grid' ? (
        <>
          <Text style={styles.label}>Rows</Text>
          <TextInput
            style={styles.input}
            value={rows}
            onChangeText={setRows}
            keyboardType="numeric"
            placeholder="Rows"
          />

          <Text style={styles.label}>Columns</Text>
          <TextInput
            style={styles.input}
            value={columns}
            onChangeText={setColumns}
            keyboardType="numeric"
            placeholder="Columns"
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Pattern</Text>
          <TextInput
            style={styles.input}
            value={pattern}
            onChangeText={setPattern}
            placeholder="3,2,3,2"
          />
          <Text style={styles.helper}>Example: 3,2,3,2 or 5,3,5,3</Text>
        </>
      )}

      <Text style={styles.label}>Strain Key</Text>
      <TextInput
        style={[styles.input, styles.largeInput]}
        value={strainKeyInput}
        onChangeText={setStrainKeyInput}
        multiline
        textAlignVertical="top"
        placeholder={"1=Diesel Cake\n2=Velvet Sherblato"}
      />
      <Text style={styles.helper}>Each line is number=strain name.</Text>

      <Pressable
        style={[styles.saveButton, isSaving && styles.disabledButton]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Saving...' : 'Save Room'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={handleCancel}
        disabled={isSaving}
      >
        <Text style={styles.secondaryButtonText}>Cancel</Text>
      </Pressable>
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
  centered: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  meta: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  helper: {
    fontSize: 14,
    marginTop: -10,
    marginBottom: 20,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  largeInput: {
    minHeight: 120,
  },
  saveButton: {
    backgroundColor: '#1f7a1f',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 17,
  },
  secondaryButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#e6e6e6',
  },
  secondaryButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#222',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
