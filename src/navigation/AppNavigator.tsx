import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import Main from './BottomTabNavigator';
import SkinAnalysisScreen from '../screens/SkinAnalysisScreen';
import AnalysisCard from '../screens/AnalysisCard';
import PasswordResetScreen from '../screens/PasswordResetScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LanguageScreen from '../screens/LanguageScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import NotificationSettings from '../screens/NotificationSettings';
import { useXderma } from '../context/AppContext';


const Stack = createStackNavigator();

const AppNavigator = () => {
  const { t } = useXderma();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />      
      <Stack.Screen name="Login" component={LoginScreen} />      
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Main" component={Main} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Language" component={LanguageScreen} 
              options={{
            headerShown: true, 
            title: t('nav.language'),
            headerStyle: { backgroundColor: '#bcccff' },
            headerTintColor: '#0F172A',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
            headerBackTitle: 'Back', // iOS
            headerTitleAlign: 'center',}}
          />
      <Stack.Screen name="Privacy" component={PrivacyScreen} 
              options={{
            headerShown: true, 
            title: t('nav.privacy'),
            headerStyle: { backgroundColor: '#bcccff' },
            headerTintColor: '#0F172A',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
            headerBackTitle: 'Back', // iOS
            headerTitleAlign: 'center',}}
 />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} 
              options={{
            headerShown: true, 
            title: t('nav.help'),
            headerStyle: { backgroundColor: '#bcccff' },
            headerTintColor: '#0F172A',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
            headerBackTitle: 'Back', // iOS
            headerTitleAlign: 'center',}}
 />
      <Stack.Screen name="NotificationSettings" component={NotificationSettings} 
              options={{
            headerShown: true, 
            title: t('nav.notifications'),
            headerStyle: { backgroundColor: '#bcccff' },
            headerTintColor: '#0F172A',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
            headerBackTitle: 'Back', // iOS
            headerTitleAlign: 'center',}}
 />
      <Stack.Screen name="SkinAnalysis" component={SkinAnalysisScreen}
        options={{
            headerShown: true, 
            title: t('nav.createListing'),
            headerStyle: { backgroundColor: '#bcccff' },
            headerTintColor: '#0F172A',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
            headerBackTitle: 'Back', // iOS
            headerTitleAlign: 'center',}}
        />
      <Stack.Screen name="Reset" component={PasswordResetScreen}
        options={{
            headerShown: false, 
            title: t('nav.passwordReset'),
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
          title: t('nav.results'),
          headerStyle: { backgroundColor: '#bcccff' },
          headerTintColor: '#0F172A',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
          headerBackTitle: 'Back', // iOS
          headerTitleAlign: 'center',        }}
    />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
