export type PlantStatus = 'active' | 'harvested' | 'destroyed';

export interface Plant {
  id: number;
  tagNumber: string;
  strainName?: string;
  status: PlantStatus;
  roomId: number;
  slotIndex: number;
}
