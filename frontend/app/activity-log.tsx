import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  getActivityLog,
  ActivityLogEntry,
} from "../store/activityLogStore";

export default function ActivityLogScreen() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);

  const loadEntries = async () => {
    const logEntries = await getActivityLog();
    setEntries(logEntries);
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Activity Log</Text>

      {entries.length === 0 ? (
        <Text style={styles.emptyText}>No activity yet.</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.action}>{formatAction(entry.action)}</Text>
            <Text style={styles.time}>
              {new Date(entry.timestamp).toLocaleString()}
            </Text>

            {entry.roomName ? (
              <Text style={styles.detail}>Room: {entry.roomName}</Text>
            ) : null}

            {entry.slotId ? (
              <Text style={styles.detail}>Slot: {entry.slotId}</Text>
            ) : null}

            {entry.tag ? (
              <Text style={styles.detail}>Tag: {entry.tag}</Text>
            ) : null}

            {entry.strain ? (
              <Text style={styles.detail}>Strain: {entry.strain}</Text>
            ) : null}

            {entry.details ? (
              <Text style={styles.note}>{entry.details}</Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function formatAction(action: string) {
  switch (action) {
    case "create_room":
      return "Create Room";
    case "delete_room":
      return "Delete Room";
    case "restore_room":
      return "Restore Room";
    case "save_plant":
      return "Save Plant";
    case "clear_slot":
      return "Clear Slot";
    case "harvest_plant":
      return "Harvest Plant";
    case "destroy_plant":
      return "Destroy Plant";
    case "move_plant":
      return "Move Plant";
    default:
      return action;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  action: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  time: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  detail: {
    fontSize: 15,
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    marginTop: 6,
    color: "#444",
  },
});
