import AsyncStorage from '@react-native-async-storage/async-storage';

export type RoomLayoutType = 'grid' | 'pattern';

export type StrainKeyEntry = {
  key: string;
  strain: string;
};

export type Room = {
  id: string;
  name: string;
  layoutType: RoomLayoutType;
  rows?: number;
  columns?: number;
  pattern?: number[];
  strainKey?: StrainKeyEntry[];
};

const ROOMS_KEY = 'tagflow_rooms';

let rooms: Room[] = [];
let loaded = false;

function normalizeRoom(room: Room): Room {
  return {
    ...room,
    strainKey: Array.isArray(room.strainKey)
      ? room.strainKey
          .map((entry) => ({
            key: String(entry?.key ?? '').trim(),
            strain: String(entry?.strain ?? '').trim(),
          }))
          .filter((entry) => entry.key && entry.strain)
      : [],
  };
}

async function saveRooms() {
  await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export async function loadRooms() {
  if (loaded) return;

  const raw = await AsyncStorage.getItem(ROOMS_KEY);
  const parsed: Room[] = raw ? JSON.parse(raw) : [];
  rooms = parsed.map(normalizeRoom);
  loaded = true;
}

export async function refreshRooms() {
  const raw = await AsyncStorage.getItem(ROOMS_KEY);
  const parsed: Room[] = raw ? JSON.parse(raw) : [];
  rooms = parsed.map(normalizeRoom);
  loaded = true;
}

export async function getRooms(): Promise<Room[]> {
  await loadRooms();
  return [...rooms];
}

export async function getRoom(id: string): Promise<Room | undefined> {
  await loadRooms();
  return rooms.find((room) => room.id === id);
}

export async function getRoomById(id: string): Promise<Room | undefined> {
  await loadRooms();
  return rooms.find((room) => room.id === id);
}

export async function addRoom(room: Room): Promise<void> {
  await loadRooms();
  rooms.push(normalizeRoom(room));
  await saveRooms();
}

export async function updateRoom(updatedRoom: Room): Promise<void> {
  await loadRooms();

  rooms = rooms.map((room) =>
    room.id === updatedRoom.id ? normalizeRoom(updatedRoom) : room
  );

  await saveRooms();
}

export async function deleteRoom(id: string): Promise<void> {
  await loadRooms();
  rooms = rooms.filter((room) => room.id !== id);
  await saveRooms();
}

export function parsePatternInput(input: string): number[] {
  return input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

export function parseStrainKeyInput(input: string): StrainKeyEntry[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawKey, ...rest] = line.split('=');
      return {
        key: String(rawKey ?? '').trim(),
        strain: rest.join('=').trim(),
      };
    })
    .filter((entry) => entry.key && entry.strain);
}

export function formatStrainKeyInput(strainKey?: StrainKeyEntry[]): string {
  return (strainKey ?? []).map((entry) => `${entry.key}=${entry.strain}`).join('\n');
}

export function getStrainNameFromKey(room: Room | null | undefined, key: string | undefined): string {
  if (!room || !key) return '';
  const match = (room.strainKey ?? []).find((entry) => entry.key === key);
  return match?.strain ?? '';
}

export function getSlotCount(room: Room): number {
  if (room.layoutType === 'grid') {
    const rows = room.rows ?? 0;
    const columns = room.columns ?? 0;
    return rows * columns;
  }

  return (room.pattern ?? []).reduce((sum, count) => sum + count, 0);
}
