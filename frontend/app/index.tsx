import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getRooms, getSlotCount, Room, deleteRoom } from '../store/roomStore';
import { deletePlantsByRoom } from '../store/plantStore';
import { addActivityLogEntry } from '../store/activityLogStore';

export default function HomeScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);

  const loadAllRooms = async () => {
    const savedRooms = await getRooms();
    setRooms(savedRooms);
  };

  useFocusEffect(
    useCallback(() => {
      loadAllRooms();
    }, [])
  );

  const handleDeleteRoom = (room: Room) => {
    Alert.alert(
      'Delete Room',
      `Delete "${room.name}" and all plants inside it?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlantsByRoom(room.id);
            await deleteRoom(room.id);

            await addActivityLogEntry({
              action: 'delete_room',
              roomId: room.id,
              roomName: room.name,
              details: 'Room deleted from dashboard.',
            });

            await loadAllRooms();
          },
        },
      ]
    );
  };

  const handleRoomActions = (room: Room) => {
    Alert.alert('Room Actions', room.name, [
      {
        text: 'Open Room',
        onPress: () => router.push(`/room/${room.id}`),
      },
      {
        text: 'Edit Room',
        onPress: () =>
          router.push({
            pathname: '/edit-room/[id]',
            params: { id: room.id },
          }),
      },
      {
        text: 'Delete Room',
        style: 'destructive',
        onPress: () => handleDeleteRoom(room),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleDashboardActions = () => {
    Alert.alert('Dashboard Actions', 'Choose an action.', [
      {
        text: 'Create Room',
        onPress: () => router.push('/create-room'),
      },
      {
        text: 'Grow GPS',
        onPress: () => router.push('/grow-gps' as any),
      },
      {
        text: 'Activity Log',
        onPress: () => router.push('/activity-log'),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>TagFlow METRC</Text>
      <Text style={styles.subtitle}>Room map + scanner + grow GPS foundation</Text>

      <View style={styles.topButtonsRow}>
        <Pressable
          style={styles.createButton}
          onPress={() => router.push('/create-room')}
        >
          <Text style={styles.createButtonText}>+ Create Room</Text>
        </Pressable>

        <Pressable style={styles.gpsButton} onPress={() => router.push('/grow-gps' as any)}>
          <Text style={styles.gpsButtonText}>Grow GPS</Text>
        </Pressable>

        <Pressable
          style={styles.actionsButton}
          onPress={handleDashboardActions}
        >
          <Text style={styles.actionsButtonText}>Actions</Text>
        </Pressable>
      </View>

      {rooms.length === 0 ? (
        <Text style={styles.emptyText}>No rooms created yet.</Text>
      ) : (
        rooms.map((room) => (
          <Pressable
            key={room.id}
            style={styles.roomCard}
            onPress={() => router.push(`/room/${room.id}`)}
            onLongPress={() => handleDeleteRoom(room)}
          >
            <View style={styles.roomCardHeader}>
              <Text style={styles.roomName}>{room.name}</Text>

              <Pressable
                style={styles.roomActionsButton}
                onPress={() => handleRoomActions(room)}
              >
                <Text style={styles.roomActionsButtonText}>Actions</Text>
              </Pressable>
            </View>

            <Text style={styles.roomDetails}>
              Layout: {room.layoutType === 'grid' ? 'Grid' : 'Pattern'}
            </Text>
            <Text style={styles.roomDetails}>Slots: {getSlotCount(room)}</Text>
            <Text style={styles.roomDetails}>Strain key entries: {room.strainKey?.length ?? 0}</Text>

            {room.layoutType === 'grid' ? (
              <Text style={styles.roomDetails}>
                {room.rows} x {room.columns}
              </Text>
            ) : (
              <Text style={styles.roomDetails}>
                Pattern: {room.pattern?.join(', ')}
              </Text>
            )}

            <Text style={styles.deleteHint}>Long press to delete room</Text>
          </Pressable>
        ))
      )}
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
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
  },
  topButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#1f7a1f',
    padding: 14,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  gpsButton: {
    backgroundColor: '#1769aa',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
  },
  gpsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsButton: {
    backgroundColor: '#1f1f1f',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
  },
  actionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  roomCard: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  roomName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  roomActionsButton: {
    backgroundColor: '#ececec',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  roomActionsButtonText: {
    fontWeight: '700',
  },
  roomDetails: {
    color: '#444',
    marginBottom: 4,
  },
  deleteHint: {
    color: '#999',
    marginTop: 8,
    fontSize: 12,
  },
});
