import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Theme } from "../../constants/Theme";
import { supabase } from "../../utils/supabase";

export default function ShoppingListScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    loadShoppingList();
  }, []);

  const loadShoppingList = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const sessionStr = await AsyncStorage.getItem("user_session");
      if (sessionStr) {
        const parsedSession = JSON.parse(sessionStr);
        setSession(parsedSession);

        if (parsedSession.family?.id) {
          const { data, error } = await supabase
            .from("shopping_items_tb")
            .select("*")
            .eq("family_id", parsedSession.family.id)
            .order("created_at", { ascending: false });
          
          if (data) setItems(data);
          if (error) console.error("Error loading shopping list:", error);
        }
      }
    } catch (error) {
      console.error("Load shopping list error:", error);
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    loadShoppingList(true);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !session?.family?.id) return;

    try {
      const { data, error } = await supabase
        .from("shopping_items_tb")
        .insert([
          {
            name: newItemName.trim(),
            family_id: session.family.id,
            quantity: 1,
            is_purchased: false,
          },
        ])
        .select()
        .single();

      if (data) {
        setItems([data, ...items]);
        setNewItemName("");
      }
      if (error) Alert.alert("ข้อผิดพลาด", "ไม่สามารถเพิ่มรายการได้");
    } catch (error) {
      console.error("Add item error:", error);
    }
  };

  const togglePurchased = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("shopping_items_tb")
        .update({ is_purchased: !currentStatus })
        .eq("id", id);

      if (!error) {
        setItems(items.map(item => 
          item.id === id ? { ...item, is_purchased: !currentStatus } : item
        ));
      }
    } catch (error) {
      console.error("Toggle purchased error:", error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("shopping_items_tb")
        .delete()
        .eq("id", id);
      
      if (!error) {
        setItems(items.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error("Delete item error:", error);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isPurchased = item.is_purchased;

    return (
      <View style={[styles.itemCard, isPurchased && styles.itemCardPurchased]}>
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => togglePurchased(item.id, isPurchased)}
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
          <Text
            style={[styles.itemName, isPurchased && styles.itemNamePurchased]}
          >
            {item.name}
          </Text>
          <Text style={styles.itemMeta}>จำนวน: {item.quantity} รายการ</Text>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteItem(item.id)}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={22}
            color={Theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const clearPurchased = async () => {
    try {
      const { error } = await supabase
        .from("shopping_items_tb")
        .delete()
        .eq("family_id", session.family.id)
        .eq("is_purchased", true);

      if (!error) {
        setItems(items.filter(item => !item.is_purchased));
      } else {
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบรายการที่ซื้อแล้วได้");
      }
    } catch (error) {
      console.error("Clear purchased error:", error);
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const purchasedCount = items.filter(i => i.is_purchased).length;

  return (
    <View style={styles.container}>
      {/* Search / Add Item Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons
            name="cart-plus"
            size={20}
            color={Theme.colors.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="เพิ่มรายการที่ต้องซื้อ..."
            placeholderTextColor={Theme.colors.onSurfaceVariant}
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={handleAddItem}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
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
          รายการทั่งหมด ({items.length})
        </Text>
        {purchasedCount > 0 && (
          <TouchableOpacity onPress={clearPurchased}>
            <Text style={styles.clearText}>ล้างที่ซื้อแล้ว ({purchasedCount})</Text>
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
    height: 48,
    fontSize: 16,
    color: Theme.colors.onSurface,
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
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceContainerLowest,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.rounding.lg,
    marginBottom: Theme.spacing.sm,
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
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.onSurface,
    marginBottom: 2,
  },
  itemNamePurchased: {
    color: Theme.colors.onSurfaceVariant,
    textDecorationLine: "line-through",
  },
  itemMeta: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  deleteButton: {
    padding: Theme.spacing.xs,
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

