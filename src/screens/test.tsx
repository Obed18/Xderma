import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

export default function FloatingNav({
  initialActive = 'home',
  onNavigate,
  onAddPress,
}: FloatingNavProps) {
  const [active, setActive] = useState(initialActive);
  const navigation = useNavigation<any>();

  const { width } = useWindowDimensions();

  /*
   * Scale the dock according to available width.
   * The reference is approximately 484px wide.
   */
  const isSmall = width < 380;
  const isVerySmall = width < 330;

  const dockWidth = isVerySmall
    ? Math.min(width - 32, 300)
    : isSmall
      ? Math.min(width - 36, 340)
      : Math.min(width - 48, 390);

  const addSize = isVerySmall
    ? 58
    : isSmall
      ? 62
      : 68;

  const handleNavigate = (id: string) => {
    setActive(id);

    if (onNavigate) {
      onNavigate(id);
      return;
    }

    const routeMap: Record<string, string> = {
      home: 'HomeScreen',
      chat: 'XDermaChatLanding',
      notifications: 'NotificationSettings',
      history: 'History',
      profile: 'Settings',
    };

    const targetRoute = routeMap[id];
    if (targetRoute) {
      navigation.navigate(targetRoute);
    }
  };

  const handleAddPress = () => {
    setActive('profile');
    onNavigate?.('profile');
    onAddPress?.();

    if (!onNavigate) {
      navigation.navigate('Settings');
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={styles.wrapper}
    >
      <View style={styles.container}>
        {/* Main navigation capsule */}
        <View
          style={[
            styles.dock,
            {
              width: dockWidth,
            },
          ]}
        >
          {/* Subtle glass highlight */}
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
                color={
                  active === id
                    ? '#F5F5F5'
                    : '#D7D7D9'
                }
                strokeWidth={1.9}
              />
            </NavButton>
          ))}
        </View>

        {/* Floating + button */}
        <AddButton
          size={addSize}
          onPress={handleAddPress}
        />
      </View>
    </View>
  );
}

type AddButtonProps = {
  size: number;
  onPress?: () => void;
};

function AddButton({
  size,
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
        color="#F4F4F5"
        strokeWidth={1.9}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',

    // Gives the dock some breathing room when placed
    // at the bottom of a screen.
    paddingHorizontal: 16,
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 14,
  },

  dock: {
    height: 66,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 6,

    borderRadius: 34,

    backgroundColor: '#242426',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.42,
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
    backgroundColor: 'rgba(255,255,255,0.055)',

    // Very subtle depth
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.018)',
  },

  addButton: {
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#18181A',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.055)',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 18,

    elevation: 10,
  },
});