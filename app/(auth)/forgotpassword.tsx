import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { Theme } from "../../constants/Theme";
import { supabase } from "../../utils/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกอีเมลของคุณ");
      return;
    }

    setLoading(true);
    try {
      // ตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่
      const { data: user, error: fetchError } = await supabase
        .from("user_tb")
        .select("email")
        .eq("email", email.trim())
        .single();

      if (fetchError || !user) {
        Alert.alert("ข้อผิดพลาด", "ไม่พบอีเมลในระบบ กรุณาตรวจสอบอีกครั้ง");
      } else {
        // ไปยังหน้าเปลี่ยนรหัสผ่าน พร้อมส่งอีเมลไปด้วย
        router.push({
          pathname: "/(auth)/resetpassword",
          params: { email: user.email },
        });
      }
    } catch {
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อกรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.navHeader, { paddingTop: insets.top || Theme.spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
              name="lock-reset" 
              size={44} 
              color={Theme.colors.primary} 
            />
          </View>
          <Text style={styles.title}>ลืมรหัสผ่าน?</Text>
          <Text style={styles.subtitle}>
            กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่านใหม่
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="email-outline" 
              size={20} 
              color={Theme.colors.onSurfaceVariant} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="อีเมล (Email)"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>
                ส่งลิงก์รีเซ็ตรหัสผ่าน
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => router.back()}
          >
            <Text style={styles.ghostButtonText}>กลับไปยังหน้าเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.surface 
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
    paddingTop: Theme.spacing.xl,
  },
  header: { 
    alignItems: "center", 
    marginBottom: Theme.spacing.xxl 
  },
  iconBadge: {
    width: 90,
    height: 90,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.secondaryContainer,
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
    fontSize: 28,
    fontWeight: "800",
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.sm,
    textAlign: "center",
  },
  subtitle: { 
    fontSize: 16, 
    color: Theme.colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 24,
  },
  form: { 
    width: "100%" 
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.md,
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Platform.OS === "ios" ? Theme.spacing.md : Theme.spacing.xs,
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: { 
    flex: 1,
    fontSize: 16, 
    color: Theme.colors.onSurface 
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounding.lg,
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
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
  ghostButton: { 
    paddingVertical: Theme.spacing.md, 
    alignItems: "center" 
  },
  ghostButtonText: {
    color: Theme.colors.onSurfaceVariant,
    fontSize: 15,
    fontWeight: "600",
  },
});
