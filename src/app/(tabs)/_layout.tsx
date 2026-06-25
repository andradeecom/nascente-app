import { Tabs } from 'expo-router';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import { House, BookOpen, Calendar, Highlighter, SlidersHorizontal } from 'lucide-react-native';
import { useTranslate } from '@/i18n';
import { useThemeStore } from '@/stores/theme';

export default function TabsLayout() {
  const translate = useTranslate();

  // The tab bar is styled via navigator screenOptions (a plain object, not a
  // Unistyles-processed component), so its themed colors don't repaint on theme
  // change on their own. Subscribe to the theme name and read colors from the
  // runtime so these options recompute when the theme switches.
  const themeName = useThemeStore((s) => s.theme);
  const { colors } = UnistylesRuntime.getTheme(themeName);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: colors.semantic.bgPrimary, borderTopColor: colors.semantic.bgTertiary },
        ],
        tabBarActiveTintColor: colors.semantic.accent,
        tabBarInactiveTintColor: colors.semantic.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: translate('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => <House size={size} color={color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="reader"
        options={{
          title: translate('tabs.reader'),
          tabBarIcon: ({ color, size, focused }) => (
            <BookOpen size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: translate('tabs.plans'),
          tabBarIcon: ({ color, size, focused }) => (
            <Calendar size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: translate('tabs.study'),
          tabBarIcon: ({ color, size, focused }) => (
            <Highlighter size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: translate('tabs.settings'),
          tabBarIcon: ({ color, size, focused }) => (
            <SlidersHorizontal size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create((theme) => ({
  // Colors live on screenOptions (driven by the runtime theme above); only
  // theme-independent layout/typography tokens remain here.
  tabBar: {
    borderTopWidth: 1,
    paddingTop: theme.spacing[2],
    height: 90,
  },
  tabLabel: {
    fontSize: theme.font.sizes.caption,
    fontWeight: theme.font.weights.medium,
  },
}));
