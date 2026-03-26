import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../constants/Theme";
import { supabase } from "../utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
        <Text style={styles.message}>เราต้องการสิทธิ์ในการใช้กล้องเพื่อสแกนบาร์โค้ด</Text>
        <Button onPress={requestPermission} title="ให้สิทธิ์เข้าถึงกล้อง" />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const sessionStr = await AsyncStorage.getItem("user_session");
      if (!sessionStr) {
        alert("ไม่พบข้อมูลเซสชัน กรุณาเข้าสู่ระบบใหม่");
        return;
      }
      const session = JSON.parse(sessionStr);
      const familyId = session.family?.id;

      if (!familyId) {
        alert("ไม่พบข้อมูลครอบครัว กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      // Add to shopping items
      const { error } = await supabase.from("shopping_items_tb").insert({
        family_id: familyId,
        name: `สินค้า: ${data}`, // Use barcode data as name for now
        quantity: 1,
        is_purchased: false,
      });

      if (error) throw error;

      alert(`สแกนสำเร็จ: ${data} เพิ่มลงรายการซื้อของแล้ว`);
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
