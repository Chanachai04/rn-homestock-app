import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { Theme } from "../../constants/Theme";
import { supabase } from "../../utils/supabase";

// Fix for bcryptjs in React Native environment
bcrypt.setRandomFallback((len: number) => {
  const array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array);
});

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !fullName || !familyName) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setLoading(true);

    try {
      // ใช้ bcryptjs ทำการ Hash โดยใช้ Salt = 10 ครั้งตาม Request
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // 1. ลงทะเบียนผู้ใช้งานใน user_tb
      const { data: userData, error: insertError } = await supabase
        .from("user_tb")
        .insert([
          {
            email: email,
            password: hashedPassword,
            fullname: fullName,
          },
        ])
        .select()
        .single();

      if (insertError || !userData) {
        console.error("User insert error:", insertError);
        Alert.alert(
          "การลงทะเบียนล้มเหลว",
          insertError?.message || "ไม่สามารถสร้างบัญชีได้ (อีเมลอาจซ้ำ)",
        );
        setLoading(false);
        return;
      }

      // 2. สร้างครอบครัวใหม่ใน families_tb
      const { data: familyData, error: familyError } = await supabase
        .from("families_tb")
        .insert([{ name: familyName }])
        .select()
        .single();

      if (familyError || !familyData) {
        console.error("Family insert error:", familyError);
        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้างข้อมูลครอบครัวได้");
        setLoading(false);
        return;
      }

      // 3. สร้าง Profile ใน profiles_tb
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const { error: profileError } = await supabase
        .from("profiles_tb")
        .insert([
          {
            user_id: userData.id,
            family_id: familyData.id,
            first_name: firstName,
            last_name: lastName,
          },
        ]);

      if (profileError) {
        console.error("Profile insert error:", profileError);
        Alert.alert(
          "เกิดข้อผิดพลาด",
          `ไม่สามารถสร้างข้อมูลโปรไฟล์ได้: ${profileError.message}`,
        );
        setLoading(false);
        return;
      }

      Alert.alert("สำเร็จ", "ลงทะเบียนเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ");
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Register error:", error);
      Alert.alert("ข้อผิดพลาด", "เกิดข้อผิดพลาดที่ไม่คาดคิด");
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>สร้างบ้านใหม่</Text>
          <Text style={styles.subtitle}>
            เริ่มต้นจัดการของใช้ในครอบครัวของคุณ
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="ชื่อ-นามสกุล (Full Name)"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="ชื่อครอบครัว (Family Name)"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              value={familyName}
              onChangeText={setFamilyName}
            />
          </View>

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
            style={[styles.primaryButton, { marginTop: Theme.spacing.lg }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>ลงทะเบียน (Sign Up)</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.ghostButtonText}>
              มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
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
  header: { alignItems: "flex-start", marginBottom: Theme.spacing.xxl },
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
