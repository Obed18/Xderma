import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  Home,
  MessageCircle,
  Bell,
  History,
  UserRound,
} from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import XDermaChatLanding from '../screens/XDermaChatLanding';
// import NotificationSettings from '../screens/NotificationSettings';
import NotificationsScreen from '../screens/NotificationsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

type NavItem = {
  id: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    icon: Home,
  },
  {
    id: 'chat',
    icon: MessageCircle,
  },
  {
    id: 'notifications',
    icon: Bell,
  },
  {
    id: 'history',
    icon: History,
  },
];

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 240,
  mass: 0.7,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NavButtonProps = {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
};

function NavButton({
  active,
  onPress,
  children,
}: NavButtonProps) {
  const pressed = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.91],
    );

    return {
      transform: [{ scale }],
    };
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, {
          duration: 100,
        });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, SPRING_CONFIG);
      }}
      style={[
        styles.navButton,
        active && styles.activeNavButton,
        containerStyle,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

type FloatingNavProps = {
  initialActive?: string;
  onNavigate?: (id: string) => void;
  onAddPress?: () => void;
};

export default function BottomTabNavigator({
  initialActive = 'home',
  onNavigate,
  onAddPress,
}: FloatingNavProps) {
  const [active, setActive] = useState(initialActive);

  const { width } = useWindowDimensions();

  /*
   * Scale the dock according to available width.
   * The reference is approximately 484px wide.
   */
  const isSmall = width < 380;
  const isVerySmall = width < 330;

  const addSize = isVerySmall
    ? 52
    : isSmall
      ? 56
      : 60;

  const dockWidth = Math.min(
    Math.max(width - addSize - 52, 200),
    300,
  );

  const handleNavigate = (id: string) => {
    setActive(id);
    onNavigate?.(id);
  };

  const handleAddPress = () => {
    setActive('profile');
    onNavigate?.('profile');
    onAddPress?.();
  };

  const renderActiveScreen = () => {
    switch (active) {
      case 'chat':
        return <XDermaChatLanding />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'profile':
        return <SettingsScreen />;
      case 'home':
      default:
        return <HomeScreen />;
    }
  };

  

  return (
    <View style={styles.screen}>
      <View style={styles.content}>{renderActiveScreen()}</View>

      <View pointerEvents="box-none" style={styles.wrapper}>
        <View style={styles.container}>
          <View
            style={[
              styles.dock,
              {
                width: dockWidth,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={styles.dockHighlight}
            />

            {NAV_ITEMS.map(({ id, icon: Icon }) => (
              <NavButton
                key={id}
                active={active === id}
                onPress={() => handleNavigate(id)}
              >
                <Icon
                  size={isVerySmall ? 22 : 25}
                  color={active === id ? '#FFF' : '#616162'}
                  strokeWidth={1.9}
                />
              </NavButton>
            ))}
          </View>

          <AddButton
            size={addSize}
            active={active === 'profile'}
            onPress={handleAddPress}
          />
        </View>
      </View>
    </View>
  );
}

type AddButtonProps = {
  size: number;
  active: boolean;
  onPress?: () => void;
};

function AddButton({
  size,
  active,
  onPress,
}: AddButtonProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.88],
    );

    return {
      transform: [{ scale }],
    };
  });

  return (
 <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
        });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, SPRING_CONFIG);
      }}
      style={[
        styles.addButton,
        active && styles.activeAddButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    >
      <UserRound
        size={24}
        color={active ? '#FFF' : '#616162'}
        strokeWidth={1.9}
      />
    </AnimatedPressable>
  );}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  content: {
    flex: 1,
  },

  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  dock: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    borderRadius: 34,
    backgroundColor: 'rgba(236, 246, 250, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(20, 144, 217, 0.15)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    // Android
    elevation: 10,
    overflow: 'hidden',
  },

  dockHighlight: {
    position: 'absolute',

    top: 1,
    left: 10,
    right: 10,

    height: 25,

    borderRadius: 30,

    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  navButton: {
    flex: 1,

    height: 54,

    alignItems: 'center',
    justifyContent: 'center',

    marginHorizontal: 2,

    borderRadius: 29,

    backgroundColor: 'transparent',
  },

  activeNavButton: {
    backgroundColor: '#0A9DED',

    // Very subtle depth
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.018)',
  },

  addButton: {
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(236, 246, 250, 0.85)',

    borderWidth: 1,
    borderColor: 'rgba(20, 144, 217, 0.15)',

    shadowColor: '#00000065',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 18,

    elevation: 10,
  },
  activeAddButton: {
    backgroundColor: '#0A9DED',

    // Very subtle depth
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.018)',
  },
});
