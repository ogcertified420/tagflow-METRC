import React, { useEffect, useState } from 'react';
import { SafeAreaView, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RoomCard from '../components/RoomCard';
import { Room } from '../types/Room';
import { getRooms } from '../services/roomsService';

const RoomListScreen: React.FC = () => {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    getRooms().then(setRooms);
  }, []);

  const handlePress = (room: Room) => {
    router.push(`/room/${room.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RoomCard room={item} onPress={handlePress} />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

export default RoomListScreen;