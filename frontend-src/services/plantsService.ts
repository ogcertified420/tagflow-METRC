import { Plant } from '../types/Plant';

export const mockPlants: Plant[] = [
  {
    id: 1,
    tagNumber: 'TAG-1001',
    strainName: 'Diesel Cake',
    status: 'active',
    roomId: 1,
    slotIndex: 0,
  },
  {
    id: 2,
    tagNumber: 'TAG-1002',
    strainName: 'Velvet Sherblato',
    status: 'active',
    roomId: 1,
    slotIndex: 3,
  },
  {
    id: 3,
    tagNumber: 'TAG-1003',
    strainName: 'OMF Gelato',
    status: 'active',
    roomId: 1,
    slotIndex: 5,
  },
  {
    id: 4,
    tagNumber: 'TAG-2001',
    strainName: 'Blue Dream',
    status: 'active',
    roomId: 2,
    slotIndex: 2,
  },
  {
    id: 5,
    tagNumber: 'TAG-2002',
    strainName: 'Wedding Cake',
    status: 'harvested',
    roomId: 2,
    slotIndex: 6,
  },
  {
    id: 6,
    tagNumber: 'TAG-3001',
    strainName: 'Sour Diesel',
    status: 'active',
    roomId: 3,
    slotIndex: 1,
  },
  {
    id: 7,
    tagNumber: 'TAG-4001',
    strainName: 'OG Kush',
    status: 'destroyed',
    roomId: 4,
    slotIndex: 0,
  },
];

export function getPlantsByRoom(roomId: number): Promise<Plant[]> {
  const plants = mockPlants.filter((plant) => plant.roomId === roomId);
  return Promise.resolve(plants);
}
