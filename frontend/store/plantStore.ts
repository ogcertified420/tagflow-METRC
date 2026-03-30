import AsyncStorage from '@react-native-async-storage/async-storage';

export type Plant = {
  tag: string;
  strain: string;
  roomId: string;
  slotId: string;
  lastFour?: string;
  strainKeyNumber?: string;
};

const PLANTS_KEY = 'tagflow_plants';

let plants: Plant[] = [];
let loaded = false;

function extractLastFour(tag: string): string {
  const digitsOnly = tag.replace(/\D/g, '');
  if (digitsOnly.length >= 4) {
    return digitsOnly.slice(-4);
  }
  return tag.trim().slice(-4);
}

function normalizePlant(plant: Plant): Plant {
  return {
    ...plant,
    tag: plant.tag.trim(),
    strain: plant.strain.trim(),
    roomId: plant.roomId.trim(),
    slotId: String(plant.slotId).trim(),
    lastFour: plant.lastFour?.trim() || extractLastFour(plant.tag),
    strainKeyNumber: plant.strainKeyNumber?.trim() || undefined,
  };
}

function toSlotNumber(slotId: string): number {
  const num = Number(String(slotId).trim());
  return Number.isFinite(num) ? num : 0;
}

function compareSlotIdsAsc(a: string, b: string): number {
  return toSlotNumber(a) - toSlotNumber(b);
}

async function savePlants() {
  await AsyncStorage.setItem(PLANTS_KEY, JSON.stringify(plants));
}

export async function loadPlants() {
  if (loaded) return;
  const raw = await AsyncStorage.getItem(PLANTS_KEY);
  const parsed: Plant[] = raw ? JSON.parse(raw) : [];
  plants = parsed.map(normalizePlant);
  loaded = true;
}

export async function refreshPlants() {
  const raw = await AsyncStorage.getItem(PLANTS_KEY);
  const parsed: Plant[] = raw ? JSON.parse(raw) : [];
  plants = parsed.map(normalizePlant);
  loaded = true;
}

export async function addPlant(plant: Plant): Promise<void> {
  await loadPlants();
  const normalizedPlant = normalizePlant(plant);

  const existingIndex = plants.findIndex(
    (p) =>
      p.roomId === normalizedPlant.roomId &&
      p.slotId === normalizedPlant.slotId
  );

  if (existingIndex >= 0) {
    plants[existingIndex] = {
      ...plants[existingIndex],
      ...normalizedPlant,
    };
  } else {
    plants.push(normalizedPlant);
  }

  await savePlants();
}

export async function getPlant(
  roomId: string,
  slotId: string
): Promise<Plant | undefined> {
  await loadPlants();
  return plants.find((p) => p.roomId === roomId && p.slotId === String(slotId));
}

export async function getPlantsByRoom(roomId: string): Promise<Plant[]> {
  await loadPlants();
  return plants
    .filter((p) => p.roomId === roomId)
    .sort((a, b) => compareSlotIdsAsc(a.slotId, b.slotId));
}

export async function getAllPlants(): Promise<Plant[]> {
  await loadPlants();
  return [...plants];
}

export async function findPlantsByLastFour(lastFour: string): Promise<Plant[]> {
  await loadPlants();
  const cleaned = lastFour.trim();
  return plants.filter((plant) => plant.lastFour === cleaned);
}

export async function findPlantByTag(tag: string): Promise<Plant | undefined> {
  await loadPlants();
  const cleaned = tag.trim();
  return plants.find((plant) => plant.tag === cleaned);
}

export async function slotHasPlant(
  roomId: string,
  slotId: string
): Promise<boolean> {
  await loadPlants();
  const cleanedSlotId = String(slotId).trim();
  return plants.some((p) => p.roomId === roomId && p.slotId === cleanedSlotId);
}

export async function getPlantBySlot(
  roomId: string,
  slotId: string
): Promise<Plant | undefined> {
  await loadPlants();
  const cleanedSlotId = String(slotId).trim();
  return plants.find((p) => p.roomId === roomId && p.slotId === cleanedSlotId);
}

export async function getNextOpenSlotId(
  roomId: string,
  totalSlots: number,
  startSlotNumber: number = 1
): Promise<string | null> {
  await loadPlants();

  const safeStart = Math.max(1, startSlotNumber);
  const safeTotal = Math.max(0, totalSlots);

  for (let slotNumber = safeStart; slotNumber <= safeTotal; slotNumber++) {
    const slotId = String(slotNumber);
    const occupied = plants.some(
      (p) => p.roomId === roomId && p.slotId === slotId
    );

    if (!occupied) {
      return slotId;
    }
  }

  return null;
}

export type AddPlantToSpecificSlotResult =
  | { success: true; plant: Plant }
  | { success: false; reason: 'duplicate_tag'; existingPlant: Plant }
  | { success: false; reason: 'slot_occupied'; existingPlant: Plant };

export async function addPlantToSpecificSlot(
  plant: Plant
): Promise<AddPlantToSpecificSlotResult> {
  await loadPlants();

  const normalizedPlant = normalizePlant(plant);

  const duplicateTag = plants.find((p) => p.tag === normalizedPlant.tag);
  if (duplicateTag) {
    return {
      success: false,
      reason: 'duplicate_tag',
      existingPlant: duplicateTag,
    };
  }

  const existingPlant = plants.find(
    (p) =>
      p.roomId === normalizedPlant.roomId &&
      p.slotId === normalizedPlant.slotId
  );

  if (existingPlant) {
    return {
      success: false,
      reason: 'slot_occupied',
      existingPlant,
    };
  }

  plants.push(normalizedPlant);
  await savePlants();

  return {
    success: true,
    plant: normalizedPlant,
  };
}

export type AutoAddResult =
  | { success: true; slotId: string; plant: Plant; nextSlotId: string | null }
  | { success: false; reason: 'duplicate_tag'; existingPlant: Plant }
  | {
      success: false;
      reason: 'slot_occupied';
      slotId: string;
      existingPlant: Plant;
    }
  | { success: false; reason: 'room_full' };

export async function autoAddPlantToSlotOrConflict(params: {
  tag: string;
  strain: string;
  roomId: string;
  slotId: string;
  totalSlots: number;
  strainKeyNumber?: string;
}): Promise<AutoAddResult> {
  await loadPlants();

  const cleanedTag = params.tag.trim();
  const cleanedSlotId = String(params.slotId).trim();

  const duplicateTag = plants.find((p) => p.tag === cleanedTag);
  if (duplicateTag) {
    return {
      success: false,
      reason: 'duplicate_tag',
      existingPlant: duplicateTag,
    };
  }

  const existingPlant = plants.find(
    (p) => p.roomId === params.roomId && p.slotId === cleanedSlotId
  );

  if (existingPlant) {
    return {
      success: false,
      reason: 'slot_occupied',
      slotId: cleanedSlotId,
      existingPlant,
    };
  }

  const newPlant: Plant = normalizePlant({
    tag: cleanedTag,
    strain: params.strain,
    roomId: params.roomId,
    slotId: cleanedSlotId,
    strainKeyNumber: params.strainKeyNumber,
  });

  plants.push(newPlant);
  await savePlants();

  const nextSlotId = await getNextOpenSlotId(
    params.roomId,
    params.totalSlots,
    toSlotNumber(cleanedSlotId) + 1
  );

  return {
    success: true,
    slotId: cleanedSlotId,
    plant: newPlant,
    nextSlotId,
  };
}

export type AutoAddToNextOpenSlotResult =
  | { success: true; slotId: string; plant: Plant; nextSlotId: string | null }
  | { success: false; reason: 'duplicate_tag'; existingPlant: Plant }
  | { success: false; reason: 'room_full' };

export async function autoAddPlantToNextOpenSlot(params: {
  tag: string;
  strain: string;
  roomId: string;
  totalSlots: number;
  startSlotNumber?: number;
  strainKeyNumber?: string;
}): Promise<AutoAddToNextOpenSlotResult> {
  await loadPlants();

  const cleanedTag = params.tag.trim();

  const existingPlant = plants.find((p) => p.tag === cleanedTag);
  if (existingPlant) {
    return {
      success: false,
      reason: 'duplicate_tag',
      existingPlant,
    };
  }

  const nextOpenSlotId = await getNextOpenSlotId(
    params.roomId,
    params.totalSlots,
    params.startSlotNumber ?? 1
  );

  if (!nextOpenSlotId) {
    return {
      success: false,
      reason: 'room_full',
    };
  }

  const newPlant: Plant = normalizePlant({
    tag: cleanedTag,
    strain: params.strain,
    roomId: params.roomId,
    slotId: nextOpenSlotId,
    strainKeyNumber: params.strainKeyNumber,
  });

  plants.push(newPlant);
  await savePlants();

  const nextSlotId = await getNextOpenSlotId(
    params.roomId,
    params.totalSlots,
    toSlotNumber(nextOpenSlotId) + 1
  );

  return {
    success: true,
    slotId: nextOpenSlotId,
    plant: newPlant,
    nextSlotId,
  };
}

export async function movePlant(
  roomId: string,
  fromSlotId: string,
  toSlotId: string
): Promise<boolean> {
  await loadPlants();

  const cleanedFrom = String(fromSlotId).trim();
  const cleanedTo = String(toSlotId).trim();

  const fromIndex = plants.findIndex(
    (p) => p.roomId === roomId && p.slotId === cleanedFrom
  );
  if (fromIndex === -1) return false;

  const targetIndex = plants.findIndex(
    (p) => p.roomId === roomId && p.slotId === cleanedTo
  );
  if (targetIndex !== -1) return false;

  plants[fromIndex] = {
    ...plants[fromIndex],
    slotId: cleanedTo,
  };

  await savePlants();
  return true;
}

export async function movePlantByTag(
  tag: string,
  roomId: string,
  toSlotId: string
): Promise<
  | { success: true; plant: Plant }
  | { success: false; reason: 'not_found' }
  | { success: false; reason: 'slot_occupied'; existingPlant: Plant }
> {
  await loadPlants();

  const cleanedTag = tag.trim();
  const cleanedTo = String(toSlotId).trim();

  const plantIndex = plants.findIndex((p) => p.tag === cleanedTag);
  if (plantIndex === -1) {
    return { success: false, reason: 'not_found' };
  }

  const targetPlant = plants.find(
    (p) => p.roomId === roomId && p.slotId === cleanedTo
  );

  if (targetPlant) {
    return {
      success: false,
      reason: 'slot_occupied',
      existingPlant: targetPlant,
    };
  }

  plants[plantIndex] = {
    ...plants[plantIndex],
    roomId,
    slotId: cleanedTo,
  };

  await savePlants();

  return {
    success: true,
    plant: plants[plantIndex],
  };
}

export async function deletePlant(
  roomId: string,
  slotId: string
): Promise<void> {
  await loadPlants();
  const cleanedSlotId = String(slotId).trim();
  plants = plants.filter(
    (p) => !(p.roomId === roomId && p.slotId === cleanedSlotId)
  );
  await savePlants();
}

export async function deletePlantByTag(tag: string): Promise<void> {
  await loadPlants();
  const cleanedTag = tag.trim();
  plants = plants.filter((p) => p.tag !== cleanedTag);
  await savePlants();
}

export async function deletePlantsByRoom(roomId: string): Promise<void> {
  await loadPlants();
  plants = plants.filter((p) => p.roomId !== roomId);
  await savePlants();
}

export async function clearAllPlants(): Promise<void> {
  plants = [];
  loaded = true;
  await savePlants();
}
