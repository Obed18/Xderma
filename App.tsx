import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { XdermaProvider } from './src/context/AppContext';

// Import both Poppins and Lexend fonts
import {
  useFonts as usePoppins,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import {
  useFonts as useLexend,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';

const App = () => {
  // Load both font families
  const [poppinsLoaded] = usePoppins({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [lexendLoaded] = useLexend({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
  });

  // Wait until all fonts are ready
  if (!poppinsLoaded || !lexendLoaded) {
    return null;
  }

  return (
    <XdermaProvider>
      <AppNavigator />
    </XdermaProvider>
  );
  
};

export default App;
