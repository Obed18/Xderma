import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 120;
const STROKE_WIDTH = 8;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ConfidenceCircle = ({ value }: { value: number }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(safeValue, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, safeValue]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      CIRCUMFERENCE - (progress.value / 100) * CIRCUMFERENCE;

    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.wrapper}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#F59E0B"
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE}
          strokeLinecap="round"
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      <View style={styles.content}>
        <Text style={styles.text}>{safeValue}%</Text>
        <Text style={styles.label}>Confidence</Text>
      </View>
    </View>
  );
};

export default ConfidenceCircle;

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  svg: {
    position: "absolute",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  label: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 2,
  },
});
