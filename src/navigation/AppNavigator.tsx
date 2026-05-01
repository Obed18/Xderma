import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MainScreen from '../screens/MainScreen';
import SkinAnalysisScreen from '../screens/SkinAnalysisScreen';
import AnalysisCard from '../screens/AnalysisCard';
import PasswordResetScreen from '../screens/PasswordResetScreen';
import SettingsScreen from '../screens/SettingsScreen';






const Stack = createStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />      
      <Stack.Screen name="Login" component={LoginScreen} />      
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SkinAnalysis" component={SkinAnalysisScreen}
        options={{
            headerShown: true, 
            title: 'Create Listing',
            headerStyle: { backgroundColor: '#bcccff' },
            headerTintColor: '#0F172A',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
            headerBackTitle: 'Back', // iOS
            headerTitleAlign: 'center',}}
        />
      <Stack.Screen name="Reset" component={PasswordResetScreen}
        options={{
            headerShown: false, 
            title: 'Password Reset',
            headerStyle: { backgroundColor: '#bcccff' },
            headerTintColor: '#0F172A',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
            headerBackTitle: 'Back', // iOS
            headerTitleAlign: 'center',}}
        />
      <Stack.Screen
        name="ResultsScreen"
        component={AnalysisCard}
        options={{
          headerShown: true, 
          title: 'Results',
          headerStyle: { backgroundColor: '#bcccff' },
          headerTintColor: '#0F172A',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
          headerBackTitle: 'Back', // iOS
          headerTitleAlign: 'center',        }}
    />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
