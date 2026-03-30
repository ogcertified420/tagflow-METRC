import AsyncStorage from "@react-native-async-storage/async-storage";

export type ActivityAction =
  | "create_room"
  | "delete_room"
  | "restore_room"
  | "save_plant"
  | "clear_slot"
  | "harvest_plant"
  | "destroy_plant"
  | "move_plant";

export type ActivityLogEntry = {
  id: string;
  action: ActivityAction;
  timestamp: string;
  roomId?: string;
  roomName?: string;
  slotId?: string;
  tag?: string;
  strain?: string;
  details?: string;
};

const ACTIVITY_LOG_KEY = "tagflow_activity_log";

let activityLog: ActivityLogEntry[] = [];
let loaded = false;

async function saveActivityLog() {
  await AsyncStorage.setItem(
    ACTIVITY_LOG_KEY,
    JSON.stringify(activityLog)
  );
}

export async function loadActivityLog() {
  if (loaded) return;

  const raw = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
  activityLog = raw ? JSON.parse(raw) : [];
  loaded = true;
}

export async function addActivityLogEntry(
  entry: Omit<ActivityLogEntry, "id" | "timestamp">
): Promise<void> {
  await loadActivityLog();

  const newEntry: ActivityLogEntry = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  activityLog.unshift(newEntry);
  await saveActivityLog();
}

export async function getActivityLog(): Promise<ActivityLogEntry[]> {
  await loadActivityLog();
  return activityLog;
}

export async function clearActivityLog(): Promise<void> {
  await loadActivityLog();
  activityLog = [];
  await saveActivityLog();
}
