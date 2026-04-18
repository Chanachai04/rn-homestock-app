import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "../constants/theme";
import {
  PriceHistoryEntry,
  formatBaht,
  getFamilyIdFromSession,
  getStoredSession,
} from "../utils/familyShopping";
import { supabase } from "../utils/supabase";

export default function ScanInScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          เราต้องการสิทธิ์ในการใช้กล้องเพื่อสแกนบาร์โค้ด
        </Text>
        <Button onPress={requestPermission} title="ให้สิทธิ์เข้าถึงกล้อง" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const session = await getStoredSession();
      const familyId = getFamilyIdFromSession(session);
      const userId = session?.user?.id ?? null;

      if (!session) {
        alert("ไม่พบข้อมูลเซสชัน กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      if (!familyId) {
        alert("ไม่พบข้อมูลครอบครัว กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const { data: recentHistory, error: historyError } = await supabase
        .from("price_history_tb")
        .select(
          "id, family_id, shopping_item_id, item_name, quantity, price, shop_name, purchased_at, notes, barcode, previous_price, price_difference, price_change_pct, price_trend",
        )
        .eq("family_id", familyId)
        .eq("barcode", data)
        .order("purchased_at", { ascending: false })
        .limit(1);

      if (historyError) throw historyError;

      const latestPrice =
        (recentHistory?.[0] as PriceHistoryEntry | undefined) ?? null;

      const { data: existingItems, error: existingError } = await supabase
        .from("shopping_items_tb")
        .select("id, quantity")
        .eq("family_id", familyId)
        .eq("barcode", data)
        .eq("is_purchased", false)
        .limit(1);

      if (existingError) throw existingError;

      if (existingItems && existingItems.length > 0) {
        const existingItem = existingItems[0];
        const { error: updateError } = await supabase
          .from("shopping_items_tb")
          .update({
            quantity: (existingItem.quantity ?? 0) + 1,
            estimated_price: latestPrice?.price ?? null,
            last_price: latestPrice?.price ?? null,
            last_shop_name: latestPrice?.shop_name ?? null,
            last_purchased_at: latestPrice?.purchased_at ?? null,
            updated_by: userId,
          })
          .eq("id", existingItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("shopping_items_tb")
          .insert({
            family_id: familyId,
            name: latestPrice?.item_name ?? `สินค้า ${data}`,
            quantity: 1,
            is_purchased: false,
            barcode: data,
            period_type: "weekly",
            period_day: 1,
            estimated_price: latestPrice?.price ?? null,
            last_price: latestPrice?.price ?? null,
            last_shop_name: latestPrice?.shop_name ?? null,
            last_purchased_at: latestPrice?.purchased_at ?? null,
            created_by: userId,
            updated_by: userId,
          });

        if (insertError) throw insertError;
      }

      alert(
        latestPrice
          ? `สแกนสำเร็จ เพิ่มเข้ารายการซื้อแล้ว\nราคาครั้งล่าสุด ${formatBaht(latestPrice.price)}`
          : `สแกนสำเร็จ: ${data} เพิ่มลงรายการซื้อของแล้ว`,
      );
      router.back();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e"],
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สแกนของเข้า</Text>
      </View>
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer} />
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.focusedContainer} />
          <View style={styles.unfocusedContainer} />
        </View>
        <View style={styles.unfocusedContainer} />
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>ยกเลิก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: Theme.spacing.md,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  middleContainer: {
    flexDirection: "row",
    height: 250,
  },
  focusedContainer: {
    flex: 6,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    backgroundColor: "transparent",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Theme.rounding.full,
  },
  cancelText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
