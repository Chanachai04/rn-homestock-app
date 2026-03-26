import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { Theme } from "../../constants/Theme";
import { supabase } from "../../utils/supabase";

export default function PriceHistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPriceHistory();
  }, []);

  const loadPriceHistory = async () => {
    try {
      setLoading(true);
      const sessionStr = await AsyncStorage.getItem("user_session");
      if (sessionStr) {
        const parsedSession = JSON.parse(sessionStr);

        if (parsedSession.family?.id) {
          const { data } = await supabase
            .from("price_history_tb")
            .select("*")
            .eq("family_id", parsedSession.family.id)
            .order("recorded_at", { ascending: false });
          
          if (data) setHistory(data);
        }
      }
    } catch (error) {
      console.error("Load price history error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (price: number) => {
    // ในตัวอย่างนี้เราใช้ไอคอนเทรนด์แบบสุ่มหรือคำนวณจากราคาเฉลี่ยได้ (แต่ที่นี่ขอใช้สีน้ำเงินเป็นหลัก)
    return (
      <MaterialCommunityIcons
        name="trending-neutral"
        size={24}
        color={Theme.colors.secondary}
      />
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text style={styles.price}>฿{item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.shopInfo}>
          <MaterialCommunityIcons
            name="storefront-outline"
            size={16}
            color={Theme.colors.onSurfaceVariant}
          />
          <Text style={styles.shopName}>{item.shop_name || "ไม่ระบุร้านค้า"}</Text>
        </View>
        <Text style={styles.date}>
          {new Date(item.recorded_at).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
          })}
        </Text>
      </View>
      <View style={styles.trendIcon}>{renderIcon(item.price)}</View>
    </View>
  );

  if (loading && history.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>สถิติราคาล่าสุด</Text>
        <Text style={styles.subtitle}>ช่วยคุณตัดสินใจก่อนซื้อของเข้าบ้าน</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ยังไม่มีข้อมูลประวัติราคา</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  header: {
    padding: Theme.spacing.xl,
    paddingBottom: Theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
  },
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.rounding.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    position: "relative",
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
    paddingRight: 32, // Allow space for icon
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.onSurface,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.colors.primary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Theme.spacing.sm,
  },
  shopInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  shopName: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  date: {
    fontSize: 12,
    color: Theme.colors.outlineVariant, // Soft text
  },
  trendIcon: {
    position: "absolute",
    top: Theme.spacing.lg,
    right: Theme.spacing.lg,
  },
  emptyContainer: {
    padding: Theme.spacing.xxl,
    alignItems: "center",
  },
  emptyText: {
    color: Theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
});

