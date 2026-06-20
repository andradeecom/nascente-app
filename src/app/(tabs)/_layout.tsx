import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { House, BookOpen, Calendar, SlidersHorizontal } from 'lucide-react-native';
import { translate } from '@/i18n';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: styles.activeColor.color,
        tabBarInactiveTintColor: styles.inactiveColor.color,
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
  tabBar: {
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderTopColor: theme.colors.semantic.bgTertiary,
    borderTopWidth: 1,
    paddingTop: theme.spacing[2],
    height: 90,
  },
  activeColor: {
    color: theme.colors.semantic.accent,
  },
  inactiveColor: {
    color: theme.colors.semantic.textSecondary,
  },
  tabLabel: {
    fontSize: theme.font.sizes.caption,
    fontWeight: theme.font.weights.medium,
  },
}));
