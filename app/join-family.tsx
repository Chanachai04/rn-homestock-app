import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../constants/theme";
import { supabase } from "../utils/supabase";

export default function JoinFamilyScreen() {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoinFamily = async () => {
    if (!inviteCode || inviteCode.length !== 5) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกรหัสเชิญชวน 5 หลักให้ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      // 1. Find family by invite code
      const { data: family, error: familyError } = await supabase
        .from("families_tb")
        .select("id, name")
        .eq("invite_code", inviteCode)
        .single();

      if (familyError || !family) {
        Alert.alert(
          "ไม่พบข้อมูล",
          "รหัสเชิญชวนไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
        );
        setLoading(false);
        return;
      }

      // 2. Get current user session
      const sessionStr = await AsyncStorage.getItem("user_session");
      if (!sessionStr) throw new Error("ไม่พบข้อมูลผู้ใช้งานในระบบ");
      const session = JSON.parse(sessionStr);

      if (!session?.user?.id) throw new Error("ไม่พบรหัสผู้ใช้งาน");

      // 3. Update user's profile to the new family
      const { error: updateError } = await supabase
        .from("profiles_tb")
        .update({ family_id: family.id })
        .eq("user_id", session.user.id);

      if (updateError) throw updateError;

      // 4. Update AsyncStorage session
      const updatedSession = {
        ...session,
        profile: {
          ...session.profile,
          family_id: family.id,
        },
        family: family,
      };

      await AsyncStorage.setItem(
        "user_session",
        JSON.stringify(updatedSession),
      );
      await AsyncStorage.setItem("family_id", family.id); // Also save family_id explicitly just in case

      Alert.alert(
        "สำเร็จ!",
        `คุณได้เข้าร่วมครอบครัว "${family.name}" เรียบร้อยแล้ว`,
      );

      // Navigate to tabs to reflect new family state
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("เกิดข้อผิดพลาด", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>เข้าร่วมครอบครัว</Text>
      <Text style={styles.subtitle}>
        กรอกรหัสเชิญชวน 5 หลักที่ได้รับจากสมาชิกในครอบครัว
        เพื่อเข้าร่วมจัดการของในบ้านร่วมกัน
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>รหัสเชิญชวน 5 หลัก</Text>
        <TextInput
          style={styles.input}
          placeholder="ตัวอย่าง 12345"
          placeholderTextColor={Theme.colors.onSurfaceVariant}
          value={inviteCode}
          onChangeText={setInviteCode}
          keyboardType="numeric"
          maxLength={5}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleJoinFamily}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>เข้าร่วมครอบครัว</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelText}>ยกเลิก</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.xl,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: Theme.spacing.xxl,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: Theme.spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounding.md,
    color: Theme.colors.onSurface,
    fontSize: 24,
    letterSpacing: 4,
    textAlign: "center",
    fontWeight: "700",
  },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounding.full,
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    padding: Theme.spacing.md,
  },
  cancelText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
