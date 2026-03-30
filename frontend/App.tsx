import React from 'react';
import { SafeAreaView } from 'react-native';
import RoomListScreen from './screens/RoomListScreen';

const App: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <RoomListScreen />
    </SafeAreaView>
  );
};

export default App;
