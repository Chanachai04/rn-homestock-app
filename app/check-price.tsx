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
  getTrendMeta,
} from "../utils/familyShopping";
import { supabase } from "../utils/supabase";

export default function CheckPriceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
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

      if (!familyId) {
        alert("ไม่พบข้อมูลเซสชัน");
        return;
      }

      const { data: results, error } = await supabase
        .from("price_history_tb")
        .select(
          "id, family_id, shopping_item_id, item_name, quantity, price, shop_name, purchased_at, notes, barcode, previous_price, price_difference, price_change_pct, price_trend",
        )
        .eq("family_id", familyId)
        .eq("barcode", data)
        .order("purchased_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (results && results.length > 0) {
        const item = results[0] as PriceHistoryEntry;
        const trendMeta = getTrendMeta(item);
        alert(
          `พบข้อมูล ${item.item_name}\nราคาล่าสุด ${formatBaht(item.price)}\n${item.shop_name ? `ร้าน ${item.shop_name}\n` : ""}${trendMeta.label}`,
        );
      } else {
        alert(`ยังไม่มีประวัติราคาจากบาร์โค้ด ${data}`);
      }
      setScanned(false);
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
          <Text style={styles.cancelText}>เสร็จสิ้น</Text>
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
    borderColor: Theme.colors.secondary,
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
