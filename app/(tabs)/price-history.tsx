import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/Theme";
import {
  PriceHistoryEntry,
  formatBaht,
  getFamilyIdFromSession,
  getStoredSession,
  getTrendMeta,
} from "../../utils/familyShopping";
import { supabase } from "../../utils/supabase";

export default function PriceHistoryScreen() {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    void loadPriceHistory();
  }, []);

  const loadPriceHistory = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const session = await getStoredSession();
      const familyId = getFamilyIdFromSession(session);

      if (!familyId) {
        setHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from("price_history_tb")
        .select(
          "id, family_id, shopping_item_id, item_name, quantity, price, shop_name, purchased_at, notes, barcode, previous_price, price_difference, price_change_pct, price_trend",
        )
        .eq("family_id", familyId)
        .order("purchased_at", { ascending: false });

      if (error) {
        throw error;
      }

      setHistory((data as PriceHistoryEntry[]) ?? []);
    } catch (error) {
      console.error("Load price history error:", error);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const renderIcon = (item: PriceHistoryEntry) => {
    const trendMeta = getTrendMeta(item);

    return (
      <MaterialCommunityIcons
        name={trendMeta.icon as never}
        size={24}
        color={trendMeta.color}
      />
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode((current) => {
      if (current) {
        setSelectedIds([]);
      }

      return !current;
    });
  };

  const toggleItemSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entryId) => entryId !== id)
        : [...current, id],
    );
  };

  const allSelectableIds = history.map((entry) => entry.id);
  const isAllSelected =
    allSelectableIds.length > 0 &&
    selectedIds.length === allSelectableIds.length;

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : allSelectableIds);
  };

  const deleteHistoryEntries = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from("price_history_tb")
        .delete()
        .in("id", ids);

      if (error) {
        throw error;
      }

      setHistory((current) =>
        current.filter((entry) => !ids.includes(entry.id)),
      );
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (error) {
      console.error("Delete price history error:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบสถิติที่เลือกได้");
    }
  };

  const confirmDeleteSelected = () => {
    if (selectedIds.length === 0) {
      Alert.alert("ยังไม่ได้เลือก", "กรุณาเลือกสถิติที่ต้องการลบก่อน");
      return;
    }

    Alert.alert(
      "ยืนยันการลบ",
      `ต้องการลบ ${selectedIds.length} รายการหรือไม่`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: () => {
            void deleteHistoryEntries(selectedIds);
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: PriceHistoryEntry }) => {
    const trendMeta = getTrendMeta(item);
    const isSelected = selectedIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        activeOpacity={selectionMode ? 0.85 : 1}
        onPress={() => {
          if (selectionMode) {
            toggleItemSelection(item.id);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            setSelectedIds([item.id]);
          }
        }}
      >
        <View style={styles.cardHeader}>
          {selectionMode ? (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => toggleItemSelection(item.id)}
            >
              <MaterialCommunityIcons
                name={
                  isSelected
                    ? "checkbox-marked-circle"
                    : "checkbox-blank-circle-outline"
                }
                size={24}
                color={
                  isSelected
                    ? Theme.colors.primary
                    : Theme.colors.onSurfaceVariant
                }
              />
            </TouchableOpacity>
          ) : null}
          <View style={styles.headerTextBlock}>
            <Text style={styles.itemName}>{item.item_name}</Text>
            <Text style={styles.price}>{formatBaht(item.price)}</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricText}>จำนวน {item.quantity} ชิ้น</Text>
          <Text style={styles.metricText}>
            {new Date(item.purchased_at).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.shopInfo}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={16}
              color={Theme.colors.onSurfaceVariant}
            />
            <Text style={styles.shopName}>
              {item.shop_name || "ไม่ระบุร้านค้า"}
            </Text>
          </View>
          <View style={styles.trendPill}>
            {renderIcon(item)}
            <Text style={styles.trendText}>{trendMeta.label}</Text>
          </View>
        </View>

        {item.notes ? <Text style={styles.noteText}>{item.notes}</Text> : null}

        {item.previous_price !== null && item.previous_price !== undefined ? (
          <Text style={styles.compareBaseline}>
            เทียบกับครั้งก่อน {formatBaht(item.previous_price)}
          </Text>
        ) : (
          <Text style={styles.compareBaseline}>
            ยังไม่มีฐานราคาเก่าก่อนหน้านี้
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>สถิติราคาล่าสุด</Text>
            <Text style={styles.subtitle}>
              ช่วยคุณตัดสินใจก่อนซื้อของเข้าบ้าน
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={toggleSelectionMode}
          >
            <Text style={styles.headerActionText}>
              {selectionMode ? "ยกเลิก" : "ลบ"}
            </Text>
          </TouchableOpacity>
        </View>

        {selectionMode ? (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>
              เลือกแล้ว {selectedIds.length} รายการ
            </Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={toggleSelectAll}
              >
                <MaterialCommunityIcons
                  name={
                    isAllSelected
                      ? "checkbox-multiple-marked"
                      : "checkbox-multiple-blank-outline"
                  }
                  size={18}
                  color={Theme.colors.primary}
                />
                <Text style={styles.selectAllText}>
                  {isAllSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bulkDeleteButton}
                onPress={confirmDeleteSelected}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={Theme.colors.onPrimary}
                />
                <Text style={styles.bulkDeleteText}>ยืนยัน</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadPriceHistory(true)}
            colors={[Theme.colors.primary]}
            tintColor={Theme.colors.primary}
          />
        }
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
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Theme.spacing.md,
  },
  headerTextWrap: {
    flex: 1,
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
  headerAction: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.full,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  headerActionText: {
    color: Theme.colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  selectionBar: {
    marginTop: Theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Theme.spacing.md,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  selectionText: {
    flex: 1,
    color: Theme.colors.onSurface,
    fontSize: 14,
    fontWeight: "600",
  },
  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounding.full,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  selectAllText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  bulkDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Theme.colors.error,
    borderRadius: Theme.rounding.full,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  bulkDeleteText: {
    color: Theme.colors.onPrimary,
    fontSize: 13,
    fontWeight: "700",
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
  cardSelected: {
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primaryContainer,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.md,
  },
  headerTextBlock: {
    flex: 1,
  },
  selectButton: {
    marginTop: 2,
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
    marginTop: 2,
  },
  cardFooter: {
    marginTop: Theme.spacing.md,
    gap: Theme.spacing.sm,
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
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Theme.spacing.md,
  },
  metricText: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.full,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 6,
    alignSelf: "flex-start",
    gap: 6,
  },
  trendText: {
    fontSize: 12,
    color: Theme.colors.onSurface,
    fontWeight: "600",
  },
  noteText: {
    marginTop: Theme.spacing.sm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  compareBaseline: {
    marginTop: Theme.spacing.sm,
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.secondary,
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
