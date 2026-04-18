import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/theme";
import {
  AppSession,
  ShoppingItem,
  formatBaht,
  getFamilyIdFromSession,
  getStoredSession,
  toNumber,
} from "../../utils/familyShopping";
import { supabase } from "../../utils/supabase";

interface PurchaseFormState {
  price: string;
  shopName: string;
  notes: string;
}

const defaultPurchaseForm: PurchaseFormState = {
  price: "",
  shopName: "",
  notes: "",
};

export default function DashboardScreen() {
  const router = useRouter();
  const [session, setSession] = useState<AppSession | null>(null);
  const [urgentItems, setUrgentItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchaseVisible, setPurchaseVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [recordingPurchase, setRecordingPurchase] = useState(false);
  const [purchaseForm, setPurchaseForm] =
    useState<PurchaseFormState>(defaultPurchaseForm);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const loadDashboardData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const storedSession = await getStoredSession();
      const familyId = getFamilyIdFromSession(storedSession);

      setSession(storedSession);

      if (!familyId) {
        setUrgentItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("shopping_items_tb")
        .select(
          "id, family_id, name, quantity, is_purchased, created_at, period_type, period_day, notes, estimated_price, last_price, last_shop_name, last_purchased_at, purchased_at, updated_at, barcode, created_by, updated_by",
        )
        .eq("family_id", familyId)
        .eq("is_purchased", false)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      setUrgentItems((data as ShoppingItem[]) ?? []);
    } catch (error) {
      console.error("Load dashboard error:", error);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const openPurchaseModal = (item: ShoppingItem) => {
    setSelectedItem(item);
    setPurchaseForm({
      price:
        toNumber(item.estimated_price) !== null
          ? String(toNumber(item.estimated_price))
          : toNumber(item.last_price) !== null
            ? String(toNumber(item.last_price))
            : "",
      shopName: item.last_shop_name ?? "",
      notes: item.notes ?? "",
    });
    setPurchaseVisible(true);
  };

  const closePurchaseModal = (forceClose = false) => {
    if (recordingPurchase && !forceClose) {
      return;
    }

    setPurchaseVisible(false);
    setSelectedItem(null);
    setPurchaseForm(defaultPurchaseForm);
  };

  const submitPurchase = async () => {
    if (!selectedItem) {
      return;
    }

    const numericPrice = Number(purchaseForm.price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกราคาที่ถูกต้อง");
      return;
    }

    setRecordingPurchase(true);

    try {
      const { error } = await supabase.rpc("record_purchase", {
        p_item_id: selectedItem.id,
        p_price: numericPrice,
        p_shop_name: purchaseForm.shopName.trim() || null,
        p_purchased_by: session?.user?.id ?? null,
        p_notes: purchaseForm.notes.trim() || null,
      });

      if (error) {
        throw error;
      }

      closePurchaseModal(true);
      await loadDashboardData();
    } catch (error) {
      console.error("Record purchase error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถบันทึกการซื้อและประวัติราคาได้");
    } finally {
      setRecordingPurchase(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadDashboardData(true)}
          colors={[Theme.colors.primary]}
          tintColor={Theme.colors.primary}
        />
      }
    >
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
                จำนวน: {item.quantity} • เพิ่มเมื่อ{" "}
                {new Date(item.created_at).toLocaleDateString("th-TH")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openPurchaseModal(item)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`บันทึกการซื้อ ${item.name}`}
            >
              <MaterialCommunityIcons
                name="check"
                size={20}
                color={Theme.colors.onPrimary}
              />
            </TouchableOpacity>
          </View>
        ))
      )}

      <Modal
        visible={purchaseVisible}
        animationType="fade"
        transparent
        onRequestClose={() => closePurchaseModal()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>บันทึกการซื้อ</Text>
              <TouchableOpacity onPress={() => closePurchaseModal()}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={Theme.colors.onSurface}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.purchaseItemName}>{selectedItem?.name}</Text>
            <Text style={styles.purchaseHint}>
              {selectedItem?.last_price
                ? `ครั้งก่อนซื้อที่ ${formatBaht(selectedItem.last_price)}${selectedItem.last_shop_name ? ` จาก ${selectedItem.last_shop_name}` : ""}`
                : "ยังไม่มีประวัติราคาเดิมสำหรับรายการนี้"}
            </Text>

            <Text style={styles.inputLabel}>ราคาที่ซื้อจริง</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              placeholder="เช่น 150.00"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              value={purchaseForm.price}
              onChangeText={(value) =>
                setPurchaseForm((current) => ({
                  ...current,
                  price: value.replace(/[^0-9.]/g, ""),
                }))
              }
            />

            <Text style={styles.inputLabel}>ร้านค้า</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="เช่น Lotus, Big C"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              value={purchaseForm.shopName}
              onChangeText={(value) =>
                setPurchaseForm((current) => ({ ...current, shopName: value }))
              }
            />

            <Text style={styles.inputLabel}>หมายเหตุ</Text>
            <TextInput
              style={[styles.modalInput, styles.notesInput]}
              placeholder="เช่น โปรโมชั่นสมาชิก, ซื้อแพ็กใหญ่"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              multiline
              textAlignVertical="top"
              value={purchaseForm.notes}
              onChangeText={(value) =>
                setPurchaseForm((current) => ({ ...current, notes: value }))
              }
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                recordingPurchase && styles.buttonDisabled,
              ]}
              onPress={() => void submitPurchase()}
              disabled={recordingPurchase}
            >
              {recordingPurchase ? (
                <ActivityIndicator color={Theme.colors.onPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  ซื้อแล้วและบันทึกราคา
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    width: 40,
    height: 40,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Theme.spacing.md,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    padding: Theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounding.xl,
    padding: Theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.colors.onSurface,
  },
  purchaseItemName: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.colors.onSurface,
  },
  purchaseHint: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    marginTop: Theme.spacing.xs,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.colors.onSurface,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  modalInput: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  notesInput: {
    minHeight: 92,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.rounding.full,
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
    marginTop: Theme.spacing.lg,
  },
  primaryButtonText: {
    color: Theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
