import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { THEME } from './src/constants/theme';
import { SplashScreen } from './src/screens/SplashScreen';
import { LanguageSelectionScreen } from './src/screens/LanguageSelectionScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { MaterialSelectionScreen } from './src/screens/MaterialSelectionScreen';
import { MaterialDetailsScreen } from './src/screens/MaterialDetailsScreen';
import { PriceEstimateScreen } from './src/screens/PriceEstimateScreen';
import { NearbyRecyclerListScreen } from './src/screens/NearbyRecyclerListScreen';
import { LotDetailsRecyclerQuoteScreen } from './src/screens/LotDetailsRecyclerQuoteScreen';
import { MyLotsScreen } from './src/screens/MyLotsScreen';
import { EarningsTransactionsScreen } from './src/screens/EarningsTransactionsScreen';

const RootNavigator = () => {
  const { currentScreen } = useApp();
  const insets = useSafeAreaInsets();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SPLASH':
        return <SplashScreen />;
      case 'LANGUAGE_SELECTION':
        return <LanguageSelectionScreen />;
      case 'LOGIN':
        return <LoginScreen />;
      case 'DASHBOARD':
        return <DashboardScreen />;
      case 'MATERIAL_SELECTION':
        return <MaterialSelectionScreen />;
      case 'MATERIAL_DETAILS':
        return <MaterialDetailsScreen />;
      case 'PRICE_ESTIMATE':
        return <PriceEstimateScreen />;
      case 'NEARBY_RECYCLERS':
        return <NearbyRecyclerListScreen />;
      case 'LOT_DETAILS':
        return <LotDetailsRecyclerQuoteScreen />;
      case 'MY_LOTS':
        return <MyLotsScreen />;
      case 'EARNINGS':
        return <EarningsTransactionsScreen />;
      default:
        return <SplashScreen />;
    }
  };

  // The app shell owns the TOP safe area only:
  //  - Android status bar, iOS notch and Dynamic Island are always cleared,
  //    whatever their real height is on the device.
  //  - The bottom is left edge-to-edge on purpose (Stitch uses full-bleed
  //    bottom bars); each screen pads its own bottom bar with the bottom inset.
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {renderScreen()}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background
  }
});
