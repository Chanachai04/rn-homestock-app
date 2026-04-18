import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  PeriodType,
  ShoppingItem,
  formatBaht,
  formatPeriodLabel,
  getFamilyIdFromSession,
  getStoredSession,
  toNumber,
} from "../../utils/familyShopping";
import { supabase } from "../../utils/supabase";

interface ItemFormState {
  name: string;
  quantity: string;
  periodType: PeriodType;
  periodDay: string;
  estimatedPrice: string;
  notes: string;
}

interface PurchaseFormState {
  price: string;
  shopName: string;
  notes: string;
}

const defaultItemForm: ItemFormState = {
  name: "",
  quantity: "1",
  periodType: "weekly",
  periodDay: "1",
  estimatedPrice: "",
  notes: "",
};

const weeklyDayOptions = [
  { value: "1", label: "วันจันทร์" },
  { value: "2", label: "วันอังคาร" },
  { value: "3", label: "วันพุธ" },
  { value: "4", label: "วันพฤหัสบดี" },
  { value: "5", label: "วันศุกร์" },
  { value: "6", label: "วันเสาร์" },
  { value: "7", label: "วันอาทิตย์" },
];

const defaultPurchaseForm: PurchaseFormState = {
  price: "",
  shopName: "",
  notes: "",
};

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState<AppSession | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [purchaseVisible, setPurchaseVisible] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [recordingPurchase, setRecordingPurchase] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [dayDropdownVisible, setDayDropdownVisible] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormState>(defaultItemForm);
  const [purchaseForm, setPurchaseForm] =
    useState<PurchaseFormState>(defaultPurchaseForm);

  useEffect(() => {
    void loadShoppingList();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadShoppingList(true);
    }, []),
  );

  const loadShoppingList = async (isRefreshing = false) => {
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
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from("shopping_items_tb")
        .select(
          "id, family_id, name, quantity, is_purchased, created_at, period_type, period_day, notes, estimated_price, last_price, last_shop_name, last_purchased_at, purchased_at, updated_at, barcode, created_by, updated_by",
        )
        .eq("family_id", familyId)
        .order("is_purchased", { ascending: true })
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      setItems((data as ShoppingItem[]) ?? []);
    } catch (error) {
      console.error("Load shopping list error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถโหลดรายการซื้อของได้");
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    void loadShoppingList(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setItemForm(defaultItemForm);
    setDayDropdownVisible(false);
    setEditorVisible(true);
  };

  const openEditModal = (item: ShoppingItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      quantity: String(item.quantity ?? 1),
      periodType: item.period_type,
      periodDay: String(item.period_day ?? 1),
      estimatedPrice:
        toNumber(item.estimated_price) === null
          ? ""
          : String(toNumber(item.estimated_price)),
      notes: item.notes ?? "",
    });
    setDayDropdownVisible(false);
    setEditorVisible(true);
  };

  const getPeriodDayOptions = () => {
    if (itemForm.periodType === "monthly") {
      return Array.from({ length: 31 }, (_, index) => ({
        value: String(index + 1),
        label: `วันที่ ${index + 1}`,
      }));
    }

    return weeklyDayOptions;
  };

  const getSelectedPeriodDayLabel = () => {
    const selectedOption = getPeriodDayOptions().find(
      (option) => option.value === itemForm.periodDay,
    );

    return selectedOption?.label ?? "เลือกวันในรอบ";
  };

  const handlePeriodTypeChange = (periodType: PeriodType) => {
    setItemForm((current) => ({
      ...current,
      periodType,
      periodDay: periodType === current.periodType ? current.periodDay : "1",
    }));
    setDayDropdownVisible(false);
  };

  const handlePeriodDaySelect = (value: string) => {
    setItemForm((current) => ({ ...current, periodDay: value }));
    setDayDropdownVisible(false);
  };

  const saveItem = async () => {
    const familyId = getFamilyIdFromSession(session);
    const userId = session?.user?.id ?? null;
    const quantity = Number(itemForm.quantity);
    const periodDay = Number(itemForm.periodDay);
    const estimatedPrice = itemForm.estimatedPrice.trim()
      ? Number(itemForm.estimatedPrice)
      : null;

    if (!familyId) {
      Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลครอบครัว กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    if (!itemForm.name.trim()) {
      Alert.alert("ข้อผิดพลาด", "กรุณาระบุชื่อรายการ");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      Alert.alert("ข้อผิดพลาด", "จำนวนต้องเป็นตัวเลขมากกว่า 0");
      return;
    }

    if (
      !Number.isInteger(periodDay) ||
      periodDay <= 0 ||
      (itemForm.periodType === "weekly" && periodDay > 7) ||
      (itemForm.periodType === "monthly" && periodDay > 31)
    ) {
      Alert.alert(
        "ข้อผิดพลาด",
        itemForm.periodType === "weekly"
          ? "รอบรายสัปดาห์ต้องอยู่ระหว่าง 1 ถึง 7"
          : "รอบรายเดือนต้องอยู่ระหว่าง 1 ถึง 31",
      );
      return;
    }

    if (
      estimatedPrice !== null &&
      (!Number.isFinite(estimatedPrice) || estimatedPrice < 0)
    ) {
      Alert.alert("ข้อผิดพลาด", "ราคาคาดการณ์ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
      return;
    }

    setSavingItem(true);

    try {
      const payload = {
        family_id: familyId,
        name: itemForm.name.trim(),
        quantity,
        is_purchased: editingItem?.is_purchased ?? false,
        period_type: itemForm.periodType,
        period_day: periodDay,
        notes: itemForm.notes.trim() || null,
        estimated_price: estimatedPrice,
        updated_by: userId,
        ...(editingItem
          ? {}
          : {
              created_by: userId,
            }),
      };

      if (editingItem) {
        const { error } = await supabase
          .from("shopping_items_tb")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("shopping_items_tb")
          .insert(payload);

        if (error) {
          throw error;
        }
      }

      setEditorVisible(false);
      setEditingItem(null);
      setDayDropdownVisible(false);
      setItemForm(defaultItemForm);
      await loadShoppingList();
    } catch (error) {
      console.error("Save item error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถบันทึกรายการได้");
    } finally {
      setSavingItem(false);
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

  const togglePurchased = async (item: ShoppingItem) => {
    try {
      if (!item.is_purchased) {
        openPurchaseModal(item);
        return;
      }

      const { error } = await supabase
        .from("shopping_items_tb")
        .update({
          is_purchased: false,
          purchased_at: null,
          updated_by: session?.user?.id ?? null,
        })
        .eq("id", item.id);

      if (error) {
        throw error;
      }

      await loadShoppingList();
    } catch (error) {
      console.error("Toggle purchased error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถอัปเดตสถานะการซื้อได้");
    }
  };

  const submitPurchase = async () => {
    if (!selectedItem || !session) {
      return;
    }

    const numericPrice = Number(purchaseForm.price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกราคาที่ถูกต้อง");
      return;
    }

    setRecordingPurchase(true);

    try {
      const now = new Date().toISOString();
      const familyId = getFamilyIdFromSession(session);

      if (!familyId) {
        throw new Error("Family ID not found");
      }

      // Update shopping item with new price
      const { error: updateError } = await supabase
        .from("shopping_items_tb")
        .update({
          last_price: numericPrice,
          last_purchased_at: now,
          last_shop_name: purchaseForm.shopName.trim() || null,
          is_purchased: true,
        })
        .eq("id", selectedItem.id);

      if (updateError) {
        throw updateError;
      }

      // Get previous price history for this item by name
      const { data: historyData } = await supabase
        .from("price_history_tb")
        .select("price")
        .eq("family_id", familyId)
        .eq("item_name", selectedItem.name)
        .order("purchased_at", { ascending: false })
        .limit(1);

      const previousPrice =
        historyData && historyData.length > 0
          ? Number(historyData[0].price)
          : null;

      // Calculate price trend and differences
      let priceTrend: "first" | "up" | "down" | "same" = "first";
      let priceDifference: number | null = null;
      let priceChangePct: number | null = null;

      if (previousPrice !== null) {
        priceDifference = numericPrice - previousPrice;

        if (priceDifference > 0) {
          priceTrend = "up";
        } else if (priceDifference < 0) {
          priceTrend = "down";
        } else {
          priceTrend = "same";
        }

        if (previousPrice !== 0) {
          priceChangePct = (priceDifference / previousPrice) * 100;
        }
      }

      // Create price history entry
      const { error: historyError } = await supabase
        .from("price_history_tb")
        .insert({
          family_id: familyId,
          shopping_item_id: selectedItem.id,
          item_name: selectedItem.name,
          quantity: selectedItem.quantity || 1,
          price: numericPrice,
          shop_name: purchaseForm.shopName.trim() || null,
          purchased_at: now,
          notes: purchaseForm.notes.trim() || null,
          barcode: selectedItem.barcode,
          previous_price: previousPrice,
          price_difference: priceDifference,
          price_change_pct: priceChangePct,
          price_trend: priceTrend,
        });

      if (historyError) {
        throw historyError;
      }

      setPurchaseVisible(false);
      setSelectedItem(null);
      setPurchaseForm(defaultPurchaseForm);
      await loadShoppingList();

      Alert.alert(
        "สำเร็จ",
        `บันทึกการซื้อแล้ว\nราคา: ${formatBaht(numericPrice)}${
          priceTrend !== "first"
            ? `\n${
                priceTrend === "up"
                  ? `เพิ่มขึ้น ${formatBaht(priceDifference)}`
                  : priceTrend === "down"
                    ? `ลดลง ${formatBaht(Math.abs(priceDifference ?? 0))}`
                    : "ราคาเท่าครั้งก่อน"
              }`
            : ""
        }`,
      );
    } catch (error) {
      console.error("Record purchase error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถบันทึกการซื้อได้");
    } finally {
      setRecordingPurchase(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("shopping_items_tb")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Delete item error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบรายการได้");
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert("ยืนยันการลบ", "ต้องการลบรายการนี้หรือไม่", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: () => {
          void deleteItem(id);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    const isPurchased = item.is_purchased;

    return (
      <TouchableOpacity
        style={styles.itemCardWrapper}
        onPress={() => {
          setSelectedItem(item);
          setPurchaseForm({
            price: item.estimated_price ? String(item.estimated_price) : "",
            shopName: "",
            notes: "",
          });
          setPurchaseVisible(true);
        }}
        activeOpacity={1}
      >
        <View
          style={[styles.itemCard, isPurchased && styles.itemCardPurchased]}
        >
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => togglePurchased(item)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={
                isPurchased
                  ? "checkbox-marked-circle"
                  : "checkbox-blank-circle-outline"
              }
              size={28}
              color={
                isPurchased ? Theme.colors.primary : Theme.colors.outlineVariant
              }
            />
          </TouchableOpacity>

          <View style={styles.itemDetails}>
            <View style={styles.itemTitleRow}>
              <Text
                style={[
                  styles.itemName,
                  isPurchased && styles.itemNamePurchased,
                ]}
              >
                {item.name}
              </Text>
              <Text style={styles.periodBadge}>
                {formatPeriodLabel(item.period_type, item.period_day)}
              </Text>
            </View>
            <Text style={styles.itemMeta}>จำนวน {item.quantity ?? 1} ชิ้น</Text>
            <View style={styles.priceMetaRow}>
              <Text style={styles.itemMeta}>
                ราคาโดยประมาณ {formatBaht(item.estimated_price)}
              </Text>
              <Text style={styles.itemMeta}>
                ราคาซื้อจริง {formatBaht(item.last_price)}
              </Text>
            </View>
            {item.last_purchased_at ? (
              <Text style={styles.itemMeta}>
                ซื้อครั้งล่าสุด{" "}
                {new Date(item.last_purchased_at).toLocaleDateString("th-TH")}
                {item.last_shop_name ? ` • ${item.last_shop_name}` : ""}
              </Text>
            ) : null}
          </View>

          <View style={styles.itemActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editActionButton]}
              onPress={() => openEditModal(item)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`แก้ไขรายการ ${item.name}`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={Theme.colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={() => confirmDelete(item.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`ลบรายการ ${item.name}`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={Theme.colors.error}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const clearPurchased = async () => {
    try {
      const familyId = getFamilyIdFromSession(session);

      if (!familyId) {
        return;
      }

      const { error } = await supabase
        .from("shopping_items_tb")
        .delete()
        .eq("family_id", familyId)
        .eq("is_purchased", true);

      if (error) {
        throw error;
      }

      setItems(items.filter((item) => !item.is_purchased));
    } catch (error) {
      console.error("Clear purchased error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบรายการที่ซื้อแล้วได้");
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const purchasedCount = items.filter((item) => item.is_purchased).length;
  const pendingCount = items.length - purchasedCount;

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons
            name="cart-plus"
            size={20}
            color={Theme.colors.primary}
            style={styles.searchIcon}
          />
          <Text style={styles.searchInput}>
            จัดการของประจำสัปดาห์และรายเดือนของบ้านคุณ
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <MaterialCommunityIcons
            name="plus"
            size={24}
            color={Theme.colors.onPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* List Header / Actions */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          คงค้าง {pendingCount} • ซื้อแล้ว {purchasedCount}
        </Text>
        {purchasedCount > 0 && (
          <TouchableOpacity onPress={() => void clearPurchased()}>
            <Text style={styles.clearText}>
              ล้างที่ซื้อแล้ว ({purchasedCount})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Theme.colors.primary]}
            tintColor={Theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ไม่มีรายการที่ต้องซื้อในขณะนี้</Text>
          </View>
        }
      />

      <Modal visible={editorVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? "แก้ไขรายการซื้อ" : "เพิ่มรายการซื้อใหม่"}
              </Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={Theme.colors.onSurface}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={!dayDropdownVisible}
            >
              <Text style={styles.inputLabel}>ชื่อรายการ</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="เช่น ข้าวสาร, นม, ผงซักฟอก"
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                value={itemForm.name}
                onChangeText={(value) =>
                  setItemForm((current) => ({ ...current, name: value }))
                }
              />

              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <Text style={styles.inputLabel}>จำนวน</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="number-pad"
                    value={itemForm.quantity}
                    onChangeText={(value) =>
                      setItemForm((current) => ({
                        ...current,
                        quantity: value.replace(/[^0-9]/g, ""),
                      }))
                    }
                  />
                </View>
                <View style={[styles.formColumn, styles.dayFieldColumn]}>
                  <Text style={styles.inputLabel}>วันในรอบ</Text>
                  <TouchableOpacity
                    style={[
                      styles.dropdownTrigger,
                      dayDropdownVisible && styles.dropdownTriggerActive,
                    ]}
                    onPress={() => setDayDropdownVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.dropdownTriggerText}>
                      {getSelectedPeriodDayLabel()}
                    </Text>
                    <MaterialCommunityIcons
                      name={dayDropdownVisible ? "chevron-up" : "chevron-down"}
                      size={22}
                      color={Theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.inputLabel}>รอบการซื้อ</Text>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    itemForm.periodType === "weekly" &&
                      styles.segmentButtonActive,
                  ]}
                  onPress={() => handlePeriodTypeChange("weekly")}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      itemForm.periodType === "weekly" &&
                        styles.segmentTextActive,
                    ]}
                  >
                    รายสัปดาห์
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    itemForm.periodType === "monthly" &&
                      styles.segmentButtonActive,
                  ]}
                  onPress={() => handlePeriodTypeChange("monthly")}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      itemForm.periodType === "monthly" &&
                        styles.segmentTextActive,
                    ]}
                  >
                    รายเดือน
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>ราคาคาดการณ์</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="เช่น 129.50"
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                keyboardType="decimal-pad"
                value={itemForm.estimatedPrice}
                onChangeText={(value) =>
                  setItemForm((current) => ({
                    ...current,
                    estimatedPrice: value.replace(/[^0-9.]/g, ""),
                  }))
                }
              />
              <Text style={styles.inputLabel}>บันทึกเพิ่มเติม</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                placeholder="เช่น ซื้อร้านเดิม หรืออยากเทียบราคาโปรโมชัน"
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                multiline
                textAlignVertical="top"
                value={itemForm.notes}
                onChangeText={(value) =>
                  setItemForm((current) => ({ ...current, notes: value }))
                }
              />

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  savingItem && styles.buttonDisabled,
                ]}
                onPress={() => void saveItem()}
                disabled={savingItem}
              >
                {savingItem ? (
                  <ActivityIndicator color={Theme.colors.onPrimary} />
                ) : (
                  <Text style={styles.primaryButtonText}>บันทึกรายการ</Text>
                )}
              </TouchableOpacity>
            </ScrollView>

            {dayDropdownVisible ? (
              <View style={styles.dayDropdownOverlay} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.dayDropdownBackdrop}
                  activeOpacity={1}
                  onPress={() => setDayDropdownVisible(false)}
                />
                <View style={styles.dayDropdownPopup}>
                  <FlatList
                    data={getPeriodDayOptions()}
                    keyExtractor={(item) => item.value}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.dayDropdownList}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => {
                      const isSelected = item.value === itemForm.periodDay;

                      return (
                        <TouchableOpacity
                          style={[
                            styles.dropdownOption,
                            isSelected && styles.dropdownOptionActive,
                          ]}
                          onPress={() => handlePeriodDaySelect(item.value)}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={purchaseVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>บันทึกการซื้อ</Text>
              <TouchableOpacity onPress={() => setPurchaseVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={Theme.colors.onSurface}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
                  setPurchaseForm((current) => ({
                    ...current,
                    shopName: value,
                  }))
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
                  <Text style={styles.primaryButtonText}>บันทึกราคา</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    zIndex: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.full,
    paddingHorizontal: Theme.spacing.md,
    marginRight: Theme.spacing.md,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    paddingVertical: Theme.spacing.md,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xs,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.onSurfaceVariant,
  },
  clearText: {
    fontSize: 14,
    color: Theme.colors.error,
    fontWeight: "600",
  },
  listContent: {
    padding: Theme.spacing.lg,
  },
  itemCardWrapper: {
    marginBottom: Theme.spacing.sm,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceContainerLowest,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.rounding.lg,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardPurchased: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    opacity: 0.7,
  },
  checkboxContainer: {
    marginRight: Theme.spacing.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Theme.spacing.sm,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.onSurface,
    marginBottom: 2,
    flex: 1,
  },
  itemNamePurchased: {
    color: Theme.colors.onSurfaceVariant,
    textDecorationLine: "line-through",
  },
  periodBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryContainer,
    borderRadius: Theme.rounding.full,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 6,
  },
  itemMeta: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  priceMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Theme.spacing.md,
  },
  priceCompareText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  priceUp: {
    color: Theme.colors.error,
  },
  priceDown: {
    color: "#15803d",
  },
  priceNeutral: {
    color: Theme.colors.secondary,
  },
  noteText: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 6,
  },
  itemActions: {
    marginLeft: Theme.spacing.sm,
    justifyContent: "center",
    gap: Theme.spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: Theme.rounding.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  editActionButton: {
    backgroundColor: Theme.colors.primaryContainer,
    borderColor: "rgba(30, 64, 175, 0.18)",
    shadowColor: Theme.colors.primary,
  },
  deleteActionButton: {
    backgroundColor: "#fef2f2",
    borderColor: "rgba(239, 68, 68, 0.18)",
    shadowColor: Theme.colors.error,
  },
  emptyContainer: {
    padding: Theme.spacing.xxl,
    alignItems: "center",
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
    maxHeight: "88%",
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
  dropdownTrigger: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownTriggerActive: {
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  dropdownTriggerText: {
    fontSize: 15,
    color: Theme.colors.onSurface,
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  dropdownOption: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  dropdownOptionActive: {
    backgroundColor: Theme.colors.primaryContainer,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  dropdownOptionTextActive: {
    color: Theme.colors.primary,
    fontWeight: "700",
  },
  notesInput: {
    minHeight: 92,
  },
  formRow: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    alignItems: "flex-start",
  },
  formColumn: {
    flex: 1,
  },
  dayFieldColumn: {
    zIndex: 5,
  },
  segmentRow: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  segmentButton: {
    flex: 1,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    paddingVertical: Theme.spacing.sm,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  segmentText: {
    color: Theme.colors.onSurfaceVariant,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: Theme.colors.onPrimary,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.rounding.full,
    paddingVertical: Theme.spacing.md,
    alignItems: "center",
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: Theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
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
  dayDropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  dayDropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dayDropdownPopup: {
    position: "absolute",
    top: 168,
    right: Theme.spacing.lg,
    width: "48%",
    maxHeight: 220,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.rounding.md,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    overflow: "hidden",
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  dayDropdownList: {
    paddingVertical: Theme.spacing.xs,
  },
});
