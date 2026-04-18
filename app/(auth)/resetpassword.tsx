import { MaterialCommunityIcons } from "@expo/vector-icons";
import bcrypt from "bcryptjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../constants/theme";
import { supabase } from "../../utils/supabase";

// Fix for bcryptjs in React Native environment
bcrypt.setRandomFallback((len: number) => {
  const array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array);
});

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSavePassword = async () => {
    if (!email) {
      Alert.alert(
        "ข้อผิดพลาด",
        "ไม่พบข้อมูลอีเมล กรุณาทำรายการใหม่จากหน้าลืมรหัสผ่าน",
      );
      return;
    }

    if (!password || !confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกรหัสผ่านให้ครบถ้วน");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 6) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    try {
      // ทำการ Hash รหัสผ่านด้วย salt 10 rounds
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // อัปเดตรหัสผ่านในฐานข้อมูล
      const { error: updateError } = await supabase
        .from("user_tb")
        .update({ password: hashedPassword })
        .eq("email", email);

      if (updateError) {
        Alert.alert("ข้อผิดพลาด", "ไม่สามารถอัปเดตรหัสผ่านได้ กรุณาลองใหม่");
      } else {
        Alert.alert("สำเร็จ", "เปลี่ยนรหัสผ่านใหม่เรียบร้อยแล้ว", [
          {
            text: "เข้าสู่ระบบ",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]);
      }
    } catch {
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อกรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.navHeader,
          { paddingTop: insets.top || Theme.spacing.sm },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={Theme.colors.onSurface}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons
              name="shield-key-outline"
              size={44}
              color={Theme.colors.primary}
            />
          </View>
          <Text style={styles.title}>รีเซ็ตรหัสผ่านใหม่</Text>
          <Text style={styles.subtitle}>
            กรุณาตั้งรหัสผ่านใหม่ที่ปลอดภัยสำหรับบัญชีของคุณ
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={20}
              color={Theme.colors.onSurfaceVariant}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="รหัสผ่านใหม่"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={20}
              color={Theme.colors.onSurfaceVariant}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="ยืนยันรหัสผ่านใหม่"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSavePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>บันทึกรหัสผ่านใหม่</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  navHeader: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  iconBadge: {
    width: 90,
    height: 90,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: Theme.colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    width: "100%",
    marginTop: Theme.spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.md,
    marginBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical:
      Platform.OS === "ios" ? Theme.spacing.md : Theme.spacing.xs,
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounding.lg,
    alignItems: "center",
    marginTop: Theme.spacing.lg,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: Theme.colors.onPrimary,
    fontSize: 17,
    fontWeight: "bold",
  },
});
