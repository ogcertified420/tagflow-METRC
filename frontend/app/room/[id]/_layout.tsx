import { Stack } from 'expo-router';

export default function RoomLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen
        name="index"
        options={{ title: 'Room Map' }}
      />
      <Stack.Screen
        name="slot/[slotId]"
        options={{ title: 'Plant Slot' }}
      />
    </Stack>
  );
}