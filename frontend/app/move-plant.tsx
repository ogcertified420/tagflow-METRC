import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  addPlant,
  deletePlant,
  getPlant,
  Plant,
} from "../store/plantStore";
import {
  getRoom,
  getRooms,
  getSlotCount,
  Room,
} from "../store/roomStore";
import { addActivityLogEntry } from "../store/activityLogStore";

type SlotRow = {
  rowIndex: number;
  slotIds: number[];
};

export default function MovePlantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const sourceRoomId = String(params.sourceRoomId);
  const sourceSlotId = String(params.sourceSlotId);

  const [sourceRoom, setSourceRoom] = useState<Room | null>(null);
  const [sourcePlant, setSourcePlant] = useState<Plant | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [occupiedSlots, setOccupiedSlots] = useState<Record<number, boolean>>(
    {}
  );

  const loadData = async () => {
    const foundSourceRoom = await getRoom(sourceRoomId);
    const foundSourcePlant = await getPlant(sourceRoomId, sourceSlotId);
    const allRooms = await getRooms();

    setSourceRoom(foundSourceRoom ?? null);
    setSourcePlant(foundSourcePlant ?? null);
    setRooms(allRooms);

    const defaultRoom =
      allRooms.find((room) => room.id !== sourceRoomId) ??
      allRooms.find((room) => room.id === sourceRoomId) ??
      null;

    setSelectedRoom(defaultRoom);

    if (defaultRoom) {
      await loadOccupiedSlots(defaultRoom);
    }
  };

  const loadOccupiedSlots = async (room: Room) => {
    const slotMap: Record<number, boolean> = {};
    const totalSlots = getSlotCount(room);

    for (let i = 1; i <= totalSlots; i++) {
      const plant = await getPlant(room.id, String(i));
      slotMap[i] = !!plant;
    }

    setOccupiedSlots(slotMap);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [sourceRoomId, sourceSlotId])
  );

  const rows = useMemo(() => {
    if (!selectedRoom) return [];

    if (selectedRoom.layoutType === "pattern") {
      let currentSlot = 1;
      const builtRows: SlotRow[] = [];

      (selectedRoom.pattern ?? []).forEach((count, rowIndex) => {
        const slotIds: number[] = [];

        for (let i = 0; i < count; i++) {
          slotIds.push(currentSlot);
          currentSlot += 1;
        }

        builtRows.push({ rowIndex, slotIds });
      });

      return builtRows;
    }

    const builtRows: SlotRow[] = [];
    let currentSlot = 1;

    for (let rowIndex = 0; rowIndex < (selectedRoom.rows ?? 0); rowIndex++) {
      const slotIds: number[] = [];

      for (
        let colIndex = 0;
        colIndex < (selectedRoom.columns ?? 0);
        colIndex++
      ) {
        slotIds.push(currentSlot);
        currentSlot += 1;
      }

      builtRows.push({ rowIndex, slotIds });
    }

    return builtRows;
  }, [selectedRoom]);

  const maxColumns = useMemo(() => {
    if (rows.length === 0) return 1;
    return Math.max(...rows.map((row) => row.slotIds.length));
  }, [rows]);

  const slotSize = getSlotSize(maxColumns);

  const handleSelectRoom = async (room: Room) => {
    setSelectedRoom(room);
    await loadOccupiedSlots(room);
  };

  const handleMove = async (destinationSlotId: number) => {
    if (!sourcePlant || !selectedRoom) return;

    const destinationOccupied = occupiedSlots[destinationSlotId];
    const sameSourceSlot =
      selectedRoom.id === sourceRoomId &&
      String(destinationSlotId) === sourceSlotId;

    if (sameSourceSlot) {
      Alert.alert("Invalid destination", "Choose a different slot.");
      return;
    }

    if (destinationOccupied) {
      Alert.alert("Slot occupied", "Choose an empty destination slot.");
      return;
    }

    Alert.alert(
      "Move Plant",
      `Move ${sourcePlant.tag} (${sourcePlant.strain}) to ${selectedRoom.name} - Slot ${destinationSlotId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move",
          onPress: async () => {
            await deletePlant(sourceRoomId, sourceSlotId);

            await addPlant({
              roomId: selectedRoom.id,
              slotId: String(destinationSlotId),
              tag: sourcePlant.tag,
              strain: sourcePlant.strain,
            });

            await addActivityLogEntry({
              action: "move_plant",
              roomId: selectedRoom.id,
              roomName: selectedRoom.name,
              slotId: String(destinationSlotId),
              tag: sourcePlant.tag,
              strain: sourcePlant.strain,
              details: `Moved from ${
                sourceRoom?.name ?? "source room"
              } slot ${sourceSlotId} to ${selectedRoom.name} slot ${destinationSlotId}.`,
            });

            router.replace(`/room/${selectedRoom.id}`);
          },
        },
      ]
    );
  };

  if (!sourcePlant || !sourceRoom) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Plant not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Move Plant</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Source</Text>
        <Text style={styles.infoText}>Room: {sourceRoom.name}</Text>
        <Text style={styles.infoText}>Slot: {sourceSlotId}</Text>
        <Text style={styles.infoText}>Tag: {sourcePlant.tag}</Text>
        <Text style={styles.infoText}>Strain: {sourcePlant.strain}</Text>
      </View>

      <Text style={styles.sectionTitle}>Choose Destination Room</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roomRow}
      >
        {rooms.map((room) => {
          const selected = selectedRoom?.id === room.id;

          return (
            <Pressable
              key={room.id}
              style={[styles.roomButton, selected && styles.roomButtonSelected]}
              onPress={() => handleSelectRoom(room)}
            >
              <Text
                style={[
                  styles.roomButtonText,
                  selected && styles.roomButtonTextSelected,
                ]}
              >
                {room.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedRoom ? (
        <>
          <Text style={styles.sectionTitle}>
            Choose Empty Slot in {selectedRoom.name}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.mapWrap}>
              {rows.map((row) => (
                <View key={row.rowIndex} style={styles.row}>
                  {row.slotIds.map((slotId) => {
                    const occupied = occupiedSlots[slotId];
                    const sameSourceSlot =
                      selectedRoom.id === sourceRoomId &&
                      String(slotId) === sourceSlotId;

                    return (
                      <Pressable
                        key={slotId}
                        style={[
                          styles.slot,
                          { width: slotSize, height: slotSize },
                          occupied && styles.occupiedSlot,
                          sameSourceSlot && styles.sourceSlot,
                        ]}
                        onPress={() => handleMove(slotId)}
                      >
                        <Text style={styles.slotNumber}>{slotId}</Text>
                        <Text style={styles.slotStatus}>
                          {sameSourceSlot
                            ? "Source"
                            : occupied
                            ? "Filled"
                            : "Empty"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </>
      ) : null}
    </ScrollView>
  );
}

function getSlotSize(maxColumns: number) {
  if (maxColumns <= 4) return 90;
  if (maxColumns <= 6) return 76;
  if (maxColumns <= 8) return 64;
  if (maxColumns <= 10) return 54;
  if (maxColumns <= 12) return 48;
  return 42;
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
  infoCard: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  roomRow: {
    paddingBottom: 10,
    gap: 10,
  },
  roomButton: {
    backgroundColor: "#ececec",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginRight: 10,
  },
  roomButtonSelected: {
    backgroundColor: "#1f7a1f",
  },
  roomButtonText: {
    color: "#111",
    fontWeight: "600",
  },
  roomButtonTextSelected: {
    color: "#fff",
  },
  mapWrap: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
  },
  slot: {
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  occupiedSlot: {
    backgroundColor: "#e6e6e6",
  },
  sourceSlot: {
    backgroundColor: "#ffe0a8",
  },
  slotNumber: {
    fontSize: 20,
    fontWeight: "700",
  },
  slotStatus: {
    fontSize: 11,
    textAlign: "center",
  },
});
