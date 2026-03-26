import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../constants/Theme";

export default function NotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stockAlertEnabled, setStockAlertEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.navHeader, { paddingTop: insets.top || Theme.spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons 
            name="chevron-left" 
            size={28} 
            color={Theme.colors.onSurface} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>การตั้งค่าการแจ้งเตือน</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons 
                name="bell-badge-outline" 
                size={24} 
                color={Theme.colors.primary} 
              />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>แจ้งเตือนของใกล้หมด</Text>
                <Text style={styles.settingSubLabel}>
                  แจ้งเตือนเมื่อสินค้าในสต็อกต่ำกว่าที่กำหนด
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: "#e2e8f0", true: Theme.colors.primaryContainer }}
              thumbColor={stockAlertEnabled ? Theme.colors.primary : "#94a3b8"}
              ios_backgroundColor="#e2e8f0"
              onValueChange={setStockAlertEnabled}
              value={stockAlertEnabled}
            />
          </View>
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIconBadge}>
            <MaterialCommunityIcons 
              name="bell-off-outline" 
              size={60} 
              color={Theme.colors.onSurfaceVariant} 
              style={{ opacity: 0.3 }}
            />
          </View>
          <Text style={styles.emptyTitle}>ไม่มีการแจ้งเตือนในขณะนี้</Text>
          <Text style={styles.emptySubtitle}>
            เราจะแจ้งให้คุณทราบเมื่อมีความเคลื่อนไหวที่สำคัญเกี่ยวกับสต็อกของคุณ
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.surface 
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceContainerHigh,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.onSurface,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Theme.spacing.md,
    marginLeft: Theme.spacing.xs,
  },
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.rounding.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.xxl,
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  settingTextContainer: {
    marginLeft: Theme.spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.onSurface,
  },
  settingSubLabel: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Theme.spacing.xxl,
    paddingHorizontal: Theme.spacing.xl,
  },
  emptyIconBadge: {
    width: 120,
    height: 120,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: Theme.colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
  },
});
