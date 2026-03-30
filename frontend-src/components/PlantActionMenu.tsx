import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onMove: () => void;
  onHarvest: () => void;
  onDestroy: () => void;
};

const PlantActionMenu: React.FC<Props> = ({
  visible,
  onClose,
  onMove,
  onHarvest,
  onDestroy,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.menu}>
          <Text style={styles.title}>Plant Actions</Text>

          <Pressable style={styles.buttonMove} onPress={onMove}>
            <Text style={styles.buttonText}>Move</Text>
          </Pressable>

          <Pressable style={styles.buttonHarvest} onPress={onHarvest}>
            <Text style={styles.buttonText}>Harvest</Text>
          </Pressable>

          <Pressable style={styles.buttonDestroy} onPress={onDestroy}>
            <Text style={styles.buttonText}>Destroy</Text>
          </Pressable>

          <Pressable style={styles.buttonCancel} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    width: '80%',
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonMove: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonHarvest: {
    backgroundColor: '#eab308',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDestroy: {
    backgroundColor: '#dc2626',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#374151',
    padding: 14,
    borderRadius: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlantActionMenu;
