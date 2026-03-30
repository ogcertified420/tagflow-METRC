import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'TagFlow METRC',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="create-room"
        options={{
          title: 'Create Room',
        }}
      />
      <Stack.Screen
        name="room/[id]/index"
        options={{
          title: 'Room Map',
        }}
      />
      <Stack.Screen
        name="room/[id]/slot/[slotId]"
        options={{
          title: 'Plant Slot',
        }}
      />
      <Stack.Screen
        name="edit-room/[id]"
        options={{
          title: 'Edit Room',
        }}
      />
      <Stack.Screen
        name="move-plant"
        options={{
          title: 'Move Plant',
        }}
      />
      <Stack.Screen
        name="scan"
        options={{
          title: 'Scan Tag',
        }}
      />
      <Stack.Screen
        name="activity-log"
        options={{
          title: 'Activity Log',
        }}
      />
    </Stack>
  );
}
