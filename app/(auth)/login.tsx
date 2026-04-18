import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import bcrypt from "bcryptjs";
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);

    try {
      const { data: user, error: userError } = await supabase
        .from("user_tb")
        .select("*")
        .eq("email", email)
        .single();

      if (userError || !user) {
        Alert.alert("ข้อผิดพลาด", "ไม่พบบัญชีผู้ใช้นี้ หรืออีเมลไม่ถูกต้อง");
      } else {
        const isMatch = bcrypt.compareSync(password, user.password);
        if (isMatch) {
          // ดึงข้อมูล Profile และ Family
          const { data: profile } = await supabase
            .from("profiles_tb")
            .select("*, families_tb(*)")
            .eq("user_id", user.id)
            .single();

          const sessionData = {
            user,
            profile,
            family: profile?.families_tb,
          };

          await AsyncStorage.setItem(
            "user_session",
            JSON.stringify(sessionData),
          );
          router.replace("/(tabs)");
        } else {
          Alert.alert("ข้อผิดพลาด", "รหัสผ่านไม่ถูกต้อง");
        }
      }
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/(auth)/register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🏠</Text>
          </View>
          <Text style={styles.title}>HomeStock</Text>
          <Text style={styles.subtitle}>แอปจัดการของใช้ในครอบครัว</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
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

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="รหัสผ่าน (Password)"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((current) => !current)}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={Theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("/(auth)/forgotpassword")}
          >
            <Text style={styles.forgotPasswordText}>ลืมรหัสผ่าน?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>
                เข้าสู่ระบบ (Sign In)
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.ghostButtonText}>
              สร้างบ้านใหม่ (Create Home)
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.surface },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Theme.spacing.xl,
  },
  header: { alignItems: "center", marginBottom: Theme.spacing.xxl },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  logoIcon: { fontSize: 40 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: Theme.colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: { fontSize: 16, color: Theme.colors.onSurfaceVariant },
  form: { width: "100%" },
  inputContainer: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.md,
    marginBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical:
      Platform.OS === "ios" ? Theme.spacing.md : Theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 16, color: Theme.colors.onSurface },
  eyeButton: {
    paddingLeft: Theme.spacing.sm,
  },
  forgotPassword: { alignSelf: "flex-end", marginBottom: Theme.spacing.xl },
  forgotPasswordText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounding.lg,
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  primaryButtonText: {
    color: Theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  ghostButton: { paddingVertical: Theme.spacing.md, alignItems: "center" },
  ghostButtonText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
