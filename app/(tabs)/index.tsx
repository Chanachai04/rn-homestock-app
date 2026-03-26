import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Theme } from "../../constants/Theme";
import { supabase } from "../../utils/supabase";

export default function DashboardScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [urgentItems, setUrgentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const sessionStr = await AsyncStorage.getItem("user_session");
      if (sessionStr) {
        const parsedSession = JSON.parse(sessionStr);
        setSession(parsedSession);

        if (parsedSession.family?.id) {
          const { data } = await supabase
            .from("shopping_items_tb")
            .select("*")
            .eq("family_id", parsedSession.family.id)
            .eq("is_purchased", false)
            .limit(5);
          
          if (data) setUrgentItems(data);
        }
      }
    } catch (error) {
      console.error("Load dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          ครอบครัว {session?.family?.name || "ของคุณ"}
        </Text>
        <Text style={styles.summarySubtitle}>
          มีรายการต้องซื้อ {urgentItems.length} รายการที่กำลังรอคุณอยู่
        </Text>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>เมนูด่วน</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push("/scan-in")}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: Theme.colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="barcode-scan"
              size={24}
              color={Theme.colors.primary}
            />
          </View>
          <Text style={styles.actionText}>สแกนของเข้า</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push("/check-price")}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: Theme.colors.secondaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={24}
              color={Theme.colors.secondary}
            />
          </View>
          <Text style={styles.actionText}>เช็คราคา</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push("/add-member")}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: Theme.colors.tertiaryFixed },
            ]}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={24}
              color={Theme.colors.onTertiaryFixed}
            />
          </View>
          <Text style={styles.actionText}>เพิ่มสมาชิก</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity or Reminders */}
      <Text style={styles.sectionTitle}>สิ่งที่ต้องซื้อด่วน (Urgent)</Text>
      {urgentItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>ไม่มีรายการด่วนในขณะนี้</Text>
        </View>
      ) : (
        urgentItems.map((item) => (
          <View key={item.id} style={styles.feedCard}>
            <View style={styles.feedIcon}>
              <MaterialCommunityIcons
                name="cart-outline"
                size={24}
                color={Theme.colors.primary}
              />
            </View>
            <View style={styles.feedDetails}>
              <Text style={styles.feedTitle}>{item.name}</Text>
              <Text style={styles.feedMeta}>
                จำนวน: {item.quantity} • เพิ่มเมื่อ {new Date(item.created_at).toLocaleDateString('th-TH')}
              </Text>
            </View>
            <TouchableOpacity style={styles.addButton}>
              <MaterialCommunityIcons
                name="check"
                size={20}
                color={Theme.colors.onPrimary}
              />
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  summaryCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    padding: Theme.spacing.xl,
    borderRadius: Theme.rounding.xl,
    marginBottom: Theme.spacing.xl,
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.xs,
  },
  summarySubtitle: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.md,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.xl,
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: Theme.rounding.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.onSurfaceVariant,
  },
  feedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceContainerLowest,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounding.lg,
    marginBottom: Theme.spacing.sm, // Spacing instead of divider line
  },
  feedIcon: {
    width: 48,
    height: 48,
    borderRadius: Theme.rounding.md,
    backgroundColor: Theme.colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.md,
  },
  feedDetails: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  feedMeta: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Theme.spacing.md,
  },
  emptyCard: {
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.rounding.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
});

