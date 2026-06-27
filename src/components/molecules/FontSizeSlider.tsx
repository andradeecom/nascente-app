import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Slider, Text, TEXT_VARIANTS } from '@/components/atoms';

type FontSizeSliderProps = {
  label: string;
  valueLabel: string;
  hint: string;
  steps: number;
  value: number;
  onChange: (index: number) => void;
};

export function FontSizeSlider({ label, valueLabel, hint, steps, value, onChange }: FontSizeSliderProps) {
  return (
    <View>
      <View style={styles.headingRow}>
        <Text variant={TEXT_VARIANTS.Overline} color="textTertiary">
          {label}
        </Text>
        <Text variant={TEXT_VARIANTS.Caption} color="textSecondary">
          {valueLabel}
        </Text>
      </View>
      <Text variant={TEXT_VARIANTS.Caption} color="textTertiary" style={styles.hint}>
        {hint}
      </Text>

      <View style={styles.row}>
        <Text variant={TEXT_VARIANTS.Callout} color="textTertiary">
          A
        </Text>

        <Slider steps={steps} value={value} onChange={onChange} />

        <Text variant={TEXT_VARIANTS.Title2} color="textTertiary">
          A
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: {
    marginTop: theme.spacing[0.5],
    marginBottom: theme.spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
}));
