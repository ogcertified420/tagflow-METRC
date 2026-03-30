import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addActivityLogEntry } from '../store/activityLogStore';
import { addPlant, deletePlant, getPlant } from '../store/plantStore';
import { getRoom, getSlotCount, Room, StrainKeyEntry } from '../store/roomStore';

type ScanMode = 'auto' | 'manual';

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const roomId = String(params.roomId ?? '');
  const initialMode =
    params.mode === 'auto' || params.mode === 'manual'
      ? params.mode
      : undefined;

  const [permission, requestPermission] = useCameraPermissions();
  const [room, setRoom] = useState<Room | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [mode, setMode] = useState<ScanMode | null>(initialMode ?? null);
  const [strain, setStrain] = useState('');
  const [selectedStrainKey, setSelectedStrainKey] = useState('');
  const [startSlotInput, setStartSlotInput] = useState('1');
  const [manualSlotInput, setManualSlotInput] = useState('1');
  const [currentSlot, setCurrentSlot] = useState(1);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [statusText, setStatusText] = useState('Set your scan options, then start scanning.');
  const [pendingManualTag, setPendingManualTag] = useState('');

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    async function loadRoomData() {
      setLoadingRoom(true);
      const foundRoom = await getRoom(roomId);
      setRoom(foundRoom ?? null);
      setLoadingRoom(false);

      if (!strain.trim() && foundRoom?.strainKey?.length === 1) {
        setSelectedStrainKey(foundRoom.strainKey[0].key);
        setStrain(foundRoom.strainKey[0].strain);
      }
    }

    loadRoomData();
  }, [roomId]);

  const totalSlots = useMemo(() => {
    if (!room) return 0;
    return getSlotCount(room);
  }, [room]);

  const parsedStartSlot = Number(startSlotInput || '0');
  const parsedManualSlot = Number(manualSlotInput || '0');
  const strainKeyEntries = room?.strainKey ?? [];
  const useManualPerScanStrainKey = mode === 'manual' && strainKeyEntries.length > 0 && !strain.trim();

  const unlockScannerSoon = () => {
    setTimeout(() => {
      setScanLocked(false);
    }, 900);
  };

  const applyStrainKeySelection = (entry: StrainKeyEntry) => {
    setSelectedStrainKey(entry.key);
    setStrain(entry.strain);
  };

  const resetFixedStrain = () => {
    setSelectedStrainKey('');
    setStrain('');
  };

  const saveScannedPlant = async (
    slotNumber: number,
    tagValue: string,
    forcedStrain?: string,
    forcedStrainKey?: string
  ) => {
    const cleanTag = tagValue.trim();
    const cleanStrain = (forcedStrain ?? strain).trim();
    const cleanStrainKey = (forcedStrainKey ?? selectedStrainKey).trim();

    if (!cleanTag) {
      setStatusText('Scanned tag was empty. Try again.');
      return;
    }

    if (!cleanStrain) {
      setStatusText('No strain selected. Choose a strain key or type a strain.');
      return;
    }

    await addPlant({
      roomId,
      slotId: String(slotNumber),
      tag: cleanTag,
      strain: cleanStrain,
      strainKeyNumber: cleanStrainKey || undefined,
    });

    await addActivityLogEntry({
      action: 'save_plant',
      roomId,
      roomName: room?.name,
      slotId: String(slotNumber),
      tag: cleanTag,
      strain: cleanStrain,
      details:
        mode === 'auto'
          ? `Plant added with scanner auto add.${cleanStrainKey ? ` Strain key ${cleanStrainKey}.` : ''}`
          : `Plant added with scanner manual add.${cleanStrainKey ? ` Strain key ${cleanStrainKey}.` : ''}`,
    });
  };

  const findNextEmptySlot = async (startFrom: number) => {
    for (let slot = startFrom; slot <= totalSlots; slot += 1) {
      const existingPlant = await getPlant(roomId, String(slot));
      if (!existingPlant) return slot;
    }

    return null;
  };

  const placeIntoNextEmptySlot = async (
    tagValue: string,
    startFrom: number,
    forcedStrain?: string,
    forcedStrainKey?: string
  ) => {
    const nextEmptySlot = await findNextEmptySlot(startFrom);

    if (!nextEmptySlot) {
      Alert.alert('No empty slots', 'There are no empty slots left from this point forward.');
      setStatusText('No empty slots left.');
      return;
    }

    await saveScannedPlant(nextEmptySlot, tagValue, forcedStrain, forcedStrainKey);
    setCurrentSlot(nextEmptySlot + 1);
    setManualSlotInput(String(nextEmptySlot));
    setStatusText(`Saved ${tagValue} to slot ${nextEmptySlot}.`);
  };

  const confirmReplaceAndPlace = async (
    slotNumber: number,
    tagValue: string,
    replaceAction: 'harvest_plant' | 'destroy_plant',
    forcedStrain?: string,
    forcedStrainKey?: string
  ) => {
    const existingPlant = await getPlant(roomId, String(slotNumber));
    if (!existingPlant) {
      await saveScannedPlant(slotNumber, tagValue, forcedStrain, forcedStrainKey);
      return;
    }

    await deletePlant(roomId, String(slotNumber));

    await addActivityLogEntry({
      action: replaceAction,
      roomId,
      roomName: room?.name,
      slotId: String(slotNumber),
      tag: existingPlant.tag,
      strain: existingPlant.strain,
      details:
        replaceAction === 'harvest_plant'
          ? 'Existing plant harvested during scanner placement.'
          : 'Existing plant destroyed during scanner placement.',
    });

    await saveScannedPlant(slotNumber, tagValue, forcedStrain, forcedStrainKey);
    setStatusText(`Replaced slot ${slotNumber} with scanned plant ${tagValue}.`);
  };

  const handleOccupiedAutoSlot = async (slotNumber: number, tagValue: string) => {
    const existingPlant = await getPlant(roomId, String(slotNumber));
    if (!existingPlant) return;

    Alert.alert(
      `Slot ${slotNumber} already filled`,
      `${existingPlant.tag} • ${existingPlant.strain}`,
      [
        {
          text: 'Skip',
          onPress: () => {
            setCurrentSlot(slotNumber + 1);
            setStatusText(`Skipped filled slot ${slotNumber}. Next slot is ${slotNumber + 1}.`);
          },
        },
        {
          text: 'Next Empty',
          onPress: () => {
            void placeIntoNextEmptySlot(tagValue, slotNumber + 1);
          },
        },
        {
          text: 'Harvest + Place',
          style: 'destructive',
          onPress: () => {
            void confirmReplaceAndPlace(slotNumber, tagValue, 'harvest_plant').then(() => {
              setCurrentSlot(slotNumber + 1);
            });
          },
        },
        {
          text: 'Destroy + Place',
          style: 'destructive',
          onPress: () => {
            void confirmReplaceAndPlace(slotNumber, tagValue, 'destroy_plant').then(() => {
              setCurrentSlot(slotNumber + 1);
            });
          },
        },
        {
          text: 'Move Existing',
          onPress: () => {
            router.push({
              pathname: '/move-plant',
              params: {
                sourceRoomId: roomId,
                sourceSlotId: String(slotNumber),
              },
            });
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleOccupiedManualSlot = async (
    slotNumber: number,
    tagValue: string,
    forcedStrain?: string,
    forcedStrainKey?: string
  ) => {
    const existingPlant = await getPlant(roomId, String(slotNumber));
    if (!existingPlant) return;

    Alert.alert(
      `Slot ${slotNumber} already filled`,
      `${existingPlant.tag} • ${existingPlant.strain}`,
      [
        {
          text: 'Next Empty',
          onPress: () => {
            void placeIntoNextEmptySlot(tagValue, slotNumber + 1, forcedStrain, forcedStrainKey);
          },
        },
        {
          text: 'Harvest + Place',
          style: 'destructive',
          onPress: () => {
            void confirmReplaceAndPlace(slotNumber, tagValue, 'harvest_plant', forcedStrain, forcedStrainKey);
          },
        },
        {
          text: 'Destroy + Place',
          style: 'destructive',
          onPress: () => {
            void confirmReplaceAndPlace(slotNumber, tagValue, 'destroy_plant', forcedStrain, forcedStrainKey);
          },
        },
        {
          text: 'Move Existing',
          onPress: () => {
            router.push({
              pathname: '/move-plant',
              params: {
                sourceRoomId: roomId,
                sourceSlotId: String(slotNumber),
              },
            });
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const completePendingManualPlacement = async (entry: StrainKeyEntry) => {
    if (!pendingManualTag) return;

    const slotNumber = parsedManualSlot;
    const existingPlant = await getPlant(roomId, String(slotNumber));

    if (existingPlant) {
      await handleOccupiedManualSlot(slotNumber, pendingManualTag, entry.strain, entry.key);
    } else {
      await saveScannedPlant(slotNumber, pendingManualTag, entry.strain, entry.key);
      setStatusText(`Saved ${pendingManualTag} to slot ${slotNumber} with strain key ${entry.key}.`);
    }

    setPendingManualTag('');
  };

  const processAutoScan = async (tagValue: string) => {
    if (!Number.isInteger(parsedStartSlot) || parsedStartSlot < 1 || parsedStartSlot > totalSlots) {
      Alert.alert('Invalid start slot', `Choose a start slot from 1 to ${totalSlots}.`);
      setScannerActive(false);
      return;
    }

    if (currentSlot > totalSlots) {
      Alert.alert('Finished', 'You reached the end of the room.');
      setStatusText('Auto add reached the end of the room.');
      setScannerActive(false);
      return;
    }

    const existingPlant = await getPlant(roomId, String(currentSlot));

    if (existingPlant) {
      setStatusText(`Slot ${currentSlot} is already filled.`);
      await handleOccupiedAutoSlot(currentSlot, tagValue);
      return;
    }

    await saveScannedPlant(currentSlot, tagValue);
    setStatusText(`Saved ${tagValue} to slot ${currentSlot}. Next slot: ${currentSlot + 1}.`);
    setCurrentSlot((value) => value + 1);
  };

  const processManualScan = async (tagValue: string) => {
    if (!Number.isInteger(parsedManualSlot) || parsedManualSlot < 1 || parsedManualSlot > totalSlots) {
      Alert.alert('Invalid slot', `Choose a slot from 1 to ${totalSlots}.`);
      setScannerActive(false);
      return;
    }

    if (useManualPerScanStrainKey) {
      setPendingManualTag(tagValue);
      setStatusText(`Scanned ${tagValue}. Now choose the strain key.`);
      return;
    }

    const existingPlant = await getPlant(roomId, String(parsedManualSlot));

    if (existingPlant) {
      setStatusText(`Slot ${parsedManualSlot} is already filled.`);
      await handleOccupiedManualSlot(parsedManualSlot, tagValue);
      return;
    }

    await saveScannedPlant(parsedManualSlot, tagValue);
    setStatusText(`Saved ${tagValue} to slot ${parsedManualSlot}.`);
  };

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanLocked || pendingManualTag) return;

    setScanLocked(true);

    try {
      if (mode === 'auto') {
        await processAutoScan(data);
      } else if (mode === 'manual') {
        await processManualScan(data);
      }
    } finally {
      unlockScannerSoon();
    }
  }

  const handleStartScanner = () => {
    if (!room) return;

    if (mode === 'auto' && !strain.trim()) {
      Alert.alert('Missing strain', 'Choose a strain key or type the strain before auto scanning.');
      return;
    }

    if (mode === 'manual' && strainKeyEntries.length === 0 && !strain.trim()) {
      Alert.alert('Missing strain', 'Type the strain before manual scanning.');
      return;
    }

    if (mode === 'auto') {
      if (!Number.isInteger(parsedStartSlot) || parsedStartSlot < 1 || parsedStartSlot > totalSlots) {
        Alert.alert('Invalid start slot', `Choose a start slot from 1 to ${totalSlots}.`);
        return;
      }

      setCurrentSlot(parsedStartSlot);
      setStatusText(`Auto add ready. Starting at slot ${parsedStartSlot}.`);
    }

    if (mode === 'manual') {
      if (!Number.isInteger(parsedManualSlot) || parsedManualSlot < 1 || parsedManualSlot > totalSlots) {
        Alert.alert('Invalid slot', `Choose a slot from 1 to ${totalSlots}.`);
        return;
      }

      setStatusText(
        useManualPerScanStrainKey
          ? `Manual add ready. Scan tag first, then pick the strain key for slot ${parsedManualSlot}.`
          : `Manual add ready. Current target slot ${parsedManualSlot}.`
      );
    }

    setScannerActive(true);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Loading camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera permission is required to scan.</Text>
        <Button title="Grant Camera Permission" onPress={requestPermission} />
      </View>
    );
  }

  if (loadingRoom) {
    return (
      <View style={styles.center}>
        <Text>Loading room...</Text>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Room not found.</Text>
      </View>
    );
  }

  if (scannerActive) {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417', 'code128', 'code39'],
          }}
          onBarcodeScanned={scanLocked ? undefined : handleBarCodeScanned}
        />

        <View style={styles.overlayTop}>
          <Text style={styles.overlayTitle}>{room.name}</Text>
          <Text style={styles.overlayText}>Mode: {mode === 'auto' ? 'Auto Add' : 'Manual Add'}</Text>
          <Text style={styles.overlayText}>Strain: {strain || 'Choose from setup / per scan'}</Text>
          {mode === 'auto' ? (
            <Text style={styles.overlayText}>Current slot: {currentSlot}</Text>
          ) : (
            <Text style={styles.overlayText}>Target slot: {manualSlotInput}</Text>
          )}
        </View>

        <View style={styles.overlayBottom}>
          <Text style={styles.overlayStatus}>{statusText}</Text>

          {pendingManualTag ? (
            <View style={styles.pendingPanel}>
              <Text style={styles.pendingTitle}>Choose strain for scanned tag</Text>
              <Text style={styles.pendingTag}>{pendingManualTag}</Text>
              <View style={styles.strainKeyWrap}>
                {strainKeyEntries.map((entry) => (
                  <Pressable
                    key={entry.key}
                    style={styles.strainKeyChip}
                    onPress={() => void completePendingManualPlacement(entry)}
                  >
                    <Text style={styles.strainKeyChipTitle}>{entry.key}</Text>
                    <Text style={styles.strainKeyChipText}>{entry.strain}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.secondaryActionButton} onPress={() => setPendingManualTag('')}>
                <Text style={styles.secondaryActionButtonText}>Cancel Tag</Text>
              </Pressable>
            </View>
          ) : mode === 'auto' ? (
            <View style={styles.inlineRow}>
              <Pressable
                style={styles.smallButton}
                onPress={() => setCurrentSlot((value) => Math.max(1, value - 1))}
              >
                <Text style={styles.smallButtonText}>Back 1</Text>
              </Pressable>
              <Pressable
                style={styles.smallButton}
                onPress={() => setCurrentSlot((value) => Math.min(totalSlots, value + 1))}
              >
                <Text style={styles.smallButtonText}>Skip 1</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.manualSlotRow}>
              <Text style={styles.manualSlotLabel}>Manual Slot</Text>
              <TextInput
                style={styles.manualSlotInput}
                keyboardType="number-pad"
                value={manualSlotInput}
                onChangeText={setManualSlotInput}
              />
            </View>
          )}

          <View style={styles.inlineRow}>
            <Pressable style={styles.secondaryActionButton} onPress={() => setScannerActive(false)}>
              <Text style={styles.secondaryActionButtonText}>Setup</Text>
            </Pressable>
            <Pressable style={styles.secondaryActionButton} onPress={() => router.replace(`/room/${roomId}`)}>
              <Text style={styles.secondaryActionButtonText}>Back to Room</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.setupContainer}>
      <Text style={styles.title}>Scanner</Text>
      <Text style={styles.subtitle}>{room.name}</Text>
      <Text style={styles.metaText}>Total slots: {totalSlots}</Text>

      <Text style={styles.sectionTitle}>Mode</Text>
      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeButton, mode === 'auto' && styles.modeButtonSelected]}
          onPress={() => setMode('auto')}
        >
          <Text style={[styles.modeButtonText, mode === 'auto' && styles.modeButtonTextSelected]}>
            Auto Add
          </Text>
          <Text style={[styles.modeHelpText, mode === 'auto' && styles.modeHelpTextSelected]}>
            Fills slots in order.
          </Text>
        </Pressable>

        <Pressable
          style={[styles.modeButton, mode === 'manual' && styles.modeButtonSelected]}
          onPress={() => setMode('manual')}
        >
          <Text style={[styles.modeButtonText, mode === 'manual' && styles.modeButtonTextSelected]}>
            Manual Add
          </Text>
          <Text style={[styles.modeHelpText, mode === 'manual' && styles.modeHelpTextSelected]}>
            Choose the slot yourself.
          </Text>
        </Pressable>
      </View>

      {strainKeyEntries.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Strain Key</Text>
          <View style={styles.strainKeyWrap}>
            {strainKeyEntries.map((entry) => {
              const selected = selectedStrainKey === entry.key;
              return (
                <Pressable
                  key={entry.key}
                  style={[styles.strainKeyChip, selected && styles.strainKeyChipSelected]}
                  onPress={() => applyStrainKeySelection(entry)}
                >
                  <Text style={[styles.strainKeyChipTitle, selected && styles.strainKeyChipTextSelected]}>{entry.key}</Text>
                  <Text style={[styles.strainKeyChipText, selected && styles.strainKeyChipTextSelected]}>{entry.strain}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.helpText}>
            Auto Add uses the selected strain for the whole scan run. Manual Add can scan first and ask for the strain key after each scan when no fixed strain is selected.
          </Text>
          <Pressable style={styles.clearSelectionButton} onPress={resetFixedStrain}>
            <Text style={styles.clearSelectionText}>Clear fixed strain selection</Text>
          </Pressable>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Custom strain text</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter strain"
        value={strain}
        onChangeText={(value) => {
          setStrain(value);
          if (value.trim() !== '') {
            setSelectedStrainKey('');
          }
        }}
      />

      {mode === 'auto' ? (
        <>
          <Text style={styles.sectionTitle}>Auto Add Start Slot</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Start slot"
            value={startSlotInput}
            onChangeText={setStartSlotInput}
          />
          <Text style={styles.helpText}>
            Use this when you want to start at slot 23, 43, or any open section instead of slot 1.
          </Text>
          <Text style={styles.helpText}>
            If the next slot is filled, you will get options to skip, place into the next empty slot, move the existing plant, harvest and place, or destroy and place.
          </Text>
        </>
      ) : null}

      {mode === 'manual' ? (
        <>
          <Text style={styles.sectionTitle}>Manual Target Slot</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Target slot"
            value={manualSlotInput}
            onChangeText={setManualSlotInput}
          />
          {strainKeyEntries.length > 0 ? (
            <Text style={styles.helpText}>
              Manual mode now supports scan first, then choose the strain key, so the grower can use the number key flow you described.
            </Text>
          ) : null}
        </>
      ) : null}

      <Pressable
        style={[styles.startButton, !mode && styles.disabledButton]}
        onPress={handleStartScanner}
        disabled={!mode}
      >
        <Text style={styles.startButtonText}>Start Scanner</Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  setupContainer: {
    padding: 20,
    paddingBottom: 48,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    marginTop: 6,
  },
  metaText: {
    color: '#666',
    marginTop: 6,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
  },
  modeButtonSelected: {
    backgroundColor: '#1f7a1f',
    borderColor: '#1f7a1f',
  },
  modeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  modeButtonTextSelected: {
    color: '#fff',
  },
  modeHelpText: {
    marginTop: 6,
    color: '#666',
  },
  modeHelpTextSelected: {
    color: '#e9f6e9',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  helpText: {
    color: '#666',
    marginTop: -4,
    marginBottom: 12,
  },
  strainKeyWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  strainKeyChip: {
    minWidth: '47%',
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  strainKeyChipSelected: {
    backgroundColor: '#1f7a1f',
    borderColor: '#1f7a1f',
  },
  strainKeyChipTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 2,
  },
  strainKeyChipText: {
    color: '#444',
  },
  strainKeyChipTextSelected: {
    color: '#fff',
  },
  clearSelectionButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  clearSelectionText: {
    color: '#1f7a1f',
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  startButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 17,
  },
  backButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#e6e6e6',
  },
  backButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#222',
  },
  disabledButton: {
    opacity: 0.5,
  },
  overlayTop: {
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  overlayText: {
    color: '#fff',
    marginTop: 4,
  },
  overlayBottom: {
    marginTop: 'auto',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.72)',
    gap: 12,
  },
  overlayStatus: {
    color: '#fff',
    fontSize: 15,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#1f7a1f',
    padding: 14,
    borderRadius: 12,
  },
  smallButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  manualSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manualSlotLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  manualSlotInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#666',
  },
  secondaryActionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  pendingPanel: {
    backgroundColor: 'rgba(15,15,15,0.92)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#555',
  },
  pendingTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  pendingTag: {
    color: '#98f09a',
    marginBottom: 12,
    fontWeight: '700',
  },
});
