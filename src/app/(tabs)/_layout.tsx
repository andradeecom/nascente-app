import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
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
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: translate('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create((theme) => ({
  tabBar: {
    backgroundColor: theme.colors.semantic.bgSecondary,
    borderTopColor: theme.colors.semantic.bgTertiary,
    borderTopWidth: 1,
    paddingTop: theme.spacing[1],
  },
  activeColor: {
    color: theme.colors.semantic.textPrimary,
  },
  inactiveColor: {
    color: theme.colors.semantic.textSecondary,
  },
  tabLabel: {
    fontSize: theme.font.sizes.caption,
    fontWeight: theme.font.weights.medium,
  },
}));
