import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "../constants/theme";
import { getStoredSession } from "../utils/familyShopping";
import { supabase } from "../utils/supabase";

export default function ScanJoinScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.message}>
          เราต้องการสิทธิ์ในการใช้กล้องเพื่อสแกน QR เพื่อเข้าร่วมครอบครัว
        </Text>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={requestPermission}
        >
          <Text style={styles.requestButtonText}>ให้สิทธิ์เข้าถึงกล้อง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);

    try {
      const session = await getStoredSession();
      if (!session || !session.user) {
        Alert.alert("ไม่พบข้อมูลผู้ใช้งาน", "กรุณาเข้าสู่ระบบใหม่");
        setScanned(false);
        return;
      }

      const { data: family, error: familyError } = await supabase
        .from("families_tb")
        .select("id, name")
        .eq("invite_code", data)
        .single();

      if (familyError || !family) {
        Alert.alert(
          "รหัสไม่ถูกต้อง",
          "ไม่พบรหัสเชิญชวนนี้ กรุณาลองใหม่อีกครั้ง",
        );
        setScanned(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles_tb")
        .update({ family_id: family.id })
        .eq("user_id", session.user.id);

      if (updateError) {
        throw updateError;
      }

      const updatedSession = {
        ...session,
        profile: { ...session.profile, family_id: family.id },
        family: family,
      };

      await AsyncStorage.setItem(
        "user_session",
        JSON.stringify(updatedSession),
      );
      await AsyncStorage.setItem("family_id", family.id);

      Alert.alert("สำเร็จ", `เข้าเป็นสมาชิกครอบครัว ${family.name} แล้ว`);
      router.back();
    } catch (err: any) {
      Alert.alert("เกิดข้อผิดพลาด", err.message);
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>สแกน QR เข้าร่วม</Text>
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
        <Text style={styles.scanHint}>
          ชี้กล้องไปที่ QR ของรหัสเชิญเข้าครอบครัว เพื่อเข้าร่วม
        </Text>
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
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.surface,
  },
  message: {
    textAlign: "center",
    color: Theme.colors.onSurface,
    fontSize: 16,
    marginBottom: Theme.spacing.lg,
  },
  requestButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.rounding.full,
  },
  requestButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
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
    paddingHorizontal: Theme.spacing.lg,
  },
  scanHint: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: Theme.spacing.md,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
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
