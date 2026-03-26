import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Theme.colors.surface,
          shadowOpacity: 0, // Removes border on iOS
          elevation: 0, // Removes border on Android
        },
        headerTitleStyle: {
          color: Theme.colors.onSurface,
          fontWeight: '700',
        },
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface, // Use surface instead of lowest container
          borderTopWidth: 1,
          borderTopColor: Theme.colors.surfaceContainerHigh,
          elevation: 10,
          shadowColor: Theme.colors.onSurface,
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -5 },
          height: 65 + insets.bottom, // Adjusted for safe area bottom spacing
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'หน้าหลัก',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-variant" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: 'รายการซื้อของ',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cart-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="price-history"
        options={{
          title: 'ประวัติราคา',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="history" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'ตั้งค่าครอบครัว',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-group-outline" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
