import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { addRoom, parseStrainKeyInput } from '../store/roomStore';
import { addActivityLogEntry } from '../store/activityLogStore';

type UnitType = 'ft' | 'm';

export default function CreateRoomScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [notes, setNotes] = useState('');
  const [strainKeyInput, setStrainKeyInput] = useState('');
  const [unit, setUnit] = useState<UnitType>('ft');
  const [saving, setSaving] = useState(false);

  const parsedStrainKey = useMemo(() => {
    return parseStrainKeyInput(strainKeyInput);
  }, [strainKeyInput]);

  const handleSave = async () => {
    try {
      if (saving) return;

      const trimmedName = name.trim();
      const trimmedNotes = notes.trim();

      if (!trimmedName) {
        Alert.alert('Missing room name', 'Please enter a room name.');
        return;
      }

      const roomWidth = Number(width);
      const roomLength = Number(length);

      if (
        !Number.isFinite(roomWidth) ||
        !Number.isFinite(roomLength) ||
        roomWidth <= 0 ||
        roomLength <= 0
      ) {
        Alert.alert(
          'Invalid room dimensions',
          `Enter valid positive numbers for room width and length in ${unit}.`
        );
        return;
      }

      if (strainKeyInput.trim().length > 0 && parsedStrainKey.length === 0) {
        Alert.alert(
          'Invalid strain key',
          'Use one line per strain like 1=Diesel Cake'
        );
        return;
      }

      setSaving(true);

      const id = Date.now().toString();

      await addRoom({
        id,
        name: trimmedName,
        layoutType: 'room-map',
        width: roomWidth,
        length: roomLength,
        unit,
        notes: trimmedNotes,
        strainKey: parsedStrainKey,
        tables: [],
      });

      await addActivityLogEntry({
        action: 'create_room',
        roomId: id,
        roomName: trimmedName,
        details: [
          `Room created with physical map ${roomWidth} x ${roomLength} ${unit}.`,
          parsedStrainKey.length
            ? `Strain key entries: ${parsedStrainKey.length}.`
            : '',
          trimmedNotes ? `Notes added.` : '',
        ]
          .filter(Boolean)
          .join(' '),
      });

      Alert.alert(
        'Room created',
        'Your room has been created. Next you can add tables inside the room map.',
        [
          {
            text: 'Go to Room',
            onPress: () => router.push(`/room/${id}`),
          },
          {
            text: 'Back to Home',
            onPress: () => router.push('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create room:', error);
      Alert.alert(
        'Save failed',
        'Something went wrong while saving the room.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Room</Text>
      <Text style={styles.subtitle}>
        Start by creating the room itself. Tables and plant layouts get added
        inside the room map after this.
      </Text>

      <Text style={styles.label}>Room Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Bloom 1"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Room Width</Text>
      <TextInput
        style={styles.input}
        value={width}
        onChangeText={setWidth}
        keyboardType="decimal-pad"
        placeholder={unit === 'ft' ? '40' : '12'}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Room Length</Text>
      <TextInput
        style={styles.input}
        value={length}
        onChangeText={setLength}
        keyboardType="decimal-pad"
        placeholder={unit === 'ft' ? '60' : '18'}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Unit</Text>
      <View style={styles.segmentRow}>
        <Pressable
          style={[styles.segmentButton, unit === 'ft' && styles.segmentActive]}
          onPress={() => setUnit('ft')}
        >
          <Text
            style={[
              styles.segmentText,
              unit === 'ft' && styles.segmentTextActive,
            ]}
          >
            Feet
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentButton, unit === 'm' && styles.segmentActive]}
          onPress={() => setUnit('m')}
        >
          <Text
            style={[
              styles.segmentText,
              unit === 'm' && styles.segmentTextActive,
            ]}
          >
            Meters
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Room Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        multiline
        textAlignVertical="top"
        placeholder="Example: 4 rolling benches, center aisle, drain on east wall"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>Create Strain Key (optional)</Text>
      <TextInput
        style={[styles.input, styles.largeInput]}
        value={strainKeyInput}
        onChangeText={setStrainKeyInput}
        multiline
        textAlignVertical="top"
        placeholder={'1=Diesel Cake\n2=Velvet Sherblato\n3=OMF Gelato'}
        placeholderTextColor="#888"
      />

      <Text style={styles.helperText}>
        One strain per line. This gets used by the scanner so growers can choose
        a number instead of typing the full strain name.
      </Text>

      {strainKeyInput.trim().length > 0 && (
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Strain Key Preview</Text>

          {parsedStrainKey.length === 0 ? (
            <Text style={styles.previewError}>
              Invalid format. Use one line per entry like 1=Diesel Cake
            </Text>
          ) : (
            parsedStrainKey.map((entry: any, index: number) => (
              <View key={`${entry.key}-${index}`} style={styles.previewRow}>
                <Text style={styles.previewKey}>{entry.key}</Text>
                <Text style={styles.previewValue}>{entry.strain}</Text>
              </View>
            ))
          )}
        </View>
      )}

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Room'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 48,
    backgroundColor: '#f7f7f7',
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#fff',
    color: '#111',
  },
  notesInput: {
    minHeight: 100,
  },
  largeInput: {
    minHeight: 120,
  },
  helperText: {
    color: '#666',
    marginTop: -6,
    marginBottom: 16,
    lineHeight: 18,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbb',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#1f7a1f',
    borderColor: '#1f7a1f',
  },
  segmentText: {
    color: '#111',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  previewKey: {
    width: 40,
    fontWeight: '700',
    color: '#1f7a1f',
  },
  previewValue: {
    flex: 1,
    color: '#222',
  },
  previewError: {
    color: '#b42318',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1f7a1f',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 17,
  },
});
