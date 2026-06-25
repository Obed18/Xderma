import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  UIManager,
  TouchableOpacity,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DisclaimerModal from "../screens/DisclaimerModal";

// IoniconNames isn't exported by @expo/vector-icons; derive the prop type instead
type IoniconNames = React.ComponentProps<typeof Ionicons>["name"];

// Import screens
import HomeScreen from "../screens/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import HistoryScreen from "../screens/HistoryScreen";
import PrivacyScreen from "../screens/PrivacyScreen";

const Tab = createBottomTabNavigator();

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EmptyScreen = () => null;

export default function BottomTabNavigator() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const navigation = useNavigation<any>();

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }: any) => ({
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: "#213952",
            borderTopWidth: 0,
            height: Platform.OS === "ios" ? 70 : 75,
            paddingBottom: Platform.OS === "ios" ? 10 : 10,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 0,
            elevation: 2,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            paddingBottom: 4,
          },
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => {
            let iconName: IoniconNames | undefined;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "History") {
              iconName = focused ? "time" : "time-outline";
            } else if (route.name === "Analyze") {
              iconName = focused ? "scan-circle" : "scan-circle-outline";
            } else if (route.name === "Privacy") {
              iconName = focused ? "document-lock" : "document-lock-outline";
            } else if (route.name === "Settings") {
              iconName = focused ? "person" : "person-outline";
            }

            if (route.name === "Analyze") {
              return (
              <View style={styles.addButtonContainer}>
                 <Ionicons name={iconName as any} size={36} color="#fff" />
              </View>
            );
            }


            return <Ionicons name={iconName as any} size={26} color={color} />;
          },
          tabBarActiveTintColor: "#0A9DED",
          tabBarInactiveTintColor: "#A6A6A6",
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
        <Tab.Screen
          name="Analyze"
          component={EmptyScreen}
          options={{
            headerShown: false,
            tabBarLabel: "",
            tabBarButton: (props) => {
              const { style, ...rest } = props;
              const cleanProps = Object.fromEntries(
                Object.entries(rest).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ])
              );
              return (
                <TouchableOpacity
                  {...cleanProps}
                  onPress={() => setShowDisclaimer(true)}
                  style={[styles.addButtonContainer, style]}
                  activeOpacity={0.85}
                />
              );
            },
          }}
        />
        <Tab.Screen name="Privacy" component={PrivacyScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Tab.Navigator>

      <DisclaimerModal
        visible={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onAgree={() => {
          setShowDisclaimer(false);
          navigation.navigate("SkinAnalysis");
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    width: 65,
    height: 65,
    backgroundColor: "#0A9DED",
    borderRadius: 32.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 6,
    elevation: 8,
  },
});
