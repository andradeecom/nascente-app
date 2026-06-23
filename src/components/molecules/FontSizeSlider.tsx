import { useEffect, useRef, useState } from 'react';
import { PanResponder, View, type GestureResponderHandlers, type LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, TextVariants } from '@/components/atoms';

type FontSizeSliderProps = {
  steps: number;
  value: number;
  onChange: (index: number) => void;
};

const THUMB_SIZE = 26;

export function FontSizeSlider({ steps, value, onChange }: FontSizeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const widthRef = useRef(0);
  const stepsRef = useRef(steps);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const [panHandlers, setPanHandlers] = useState<GestureResponderHandlers>({} as GestureResponderHandlers);

  useEffect(() => {
    const updateFromX = (x: number) => {
      const travel = widthRef.current - THUMB_SIZE;
      if (travel <= 0) return;
      const ratio = Math.min(1, Math.max(0, (x - THUMB_SIZE / 2) / travel));
      const index = Math.round(ratio * (stepsRef.current - 1));
      onChangeRef.current(index);
    };

    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => updateFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => updateFromX(e.nativeEvent.locationX),
    });

    setPanHandlers(responder.panHandlers);
  }, []);

  const handleLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const ratio = steps > 1 ? value / (steps - 1) : 0;
  const travel = Math.max(0, trackWidth - THUMB_SIZE);
  const thumbLeft = travel * ratio;
  const fillWidth = thumbLeft + THUMB_SIZE / 2;

  return (
    <View style={styles.row}>
      <Text variant={TextVariants.Callout} color="textTertiary">
        A
      </Text>

      <View style={styles.track} onLayout={handleLayout} {...panHandlers}>
        <View style={styles.rail} />
        <View style={[styles.fill, { width: fillWidth }]} />
        <View style={[styles.thumb, { left: thumbLeft }]} />
      </View>

      <Text variant={TextVariants.Title2} color="textTertiary">
        A
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  track: {
    flex: 1,
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  rail: {
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.bgTertiary,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accent,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderWidth: 2,
    borderColor: theme.colors.semantic.accent,
  },
}));
