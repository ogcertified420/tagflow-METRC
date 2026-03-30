export type SlotStatus = 'empty' | 'occupied' | 'harvested' | 'destroyed';

export interface Slot {
  index: number;
  row: number;
  column: number;
  status: SlotStatus;
  plantId?: number;
}
