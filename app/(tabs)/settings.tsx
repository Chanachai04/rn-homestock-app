import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import bcrypt from "bcryptjs";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/theme";
import { supabase } from "../../utils/supabase";

bcrypt.setRandomFallback((len: number) => {
  const array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array);
});

export default function SettingsScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editFamilyName, setEditFamilyName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  const handleOpenEditProfile = () => {
    if (!session) return;
    setEditFullName(session.user?.fullname || "");
    setEditFamilyName(session.family?.name || "");
    setEditEmail(session.user?.email || "");
    setEditPassword("");
    setEditConfirmPassword("");
    setShowEditProfileModal(true);
  };

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

  const saveProfileUpdates = async () => {
    if (!session?.user?.id) return;
    setSaveLoading(true);

    try {
      const fullName = editFullName.trim();
      const updates: any = {
        fullname: fullName,
        email: editEmail.trim().toLowerCase(),
      };

      if (editPassword) {
        if (editPassword.length < 6) {
          Alert.alert("ข้อผิดพลาด", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
          return;
        }
        if (editPassword !== editConfirmPassword) {
          Alert.alert("ข้อผิดพลาด", "รหัสผ่านกับการยืนยันรหัสผ่านไม่ตรงกัน");
          return;
        }
        const salt = bcrypt.genSaltSync(10);
        updates.password = bcrypt.hashSync(editPassword, salt);
      }

      const { error: userError } = await supabase
        .from("user_tb")
        .update(updates)
        .eq("id", session.user.id);

      if (userError) {
        throw userError;
      }

      const nameParts = fullName.split(" ").filter(Boolean);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const { error: profileError } = await supabase
        .from("profiles_tb")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("user_id", session.user.id);

      if (profileError) {
        throw profileError;
      }

      let updatedSession: any = {
        ...session,
        user: {
          ...session.user,
          fullname: fullName,
          email: editEmail.trim().toLowerCase(),
        },
        profile: {
          ...session.profile,
          first_name: firstName,
          last_name: lastName,
        },
      };

      if (session.family?.id) {
        const { error: familyError } = await supabase
          .from("families_tb")
          .update({ name: editFamilyName.trim() })
          .eq("id", session.family.id);

        if (familyError) {
          throw familyError;
        }

        updatedSession = {
          ...updatedSession,
          family: {
            ...session.family,
            name: editFamilyName.trim(),
          },
        };
      }

      await AsyncStorage.setItem(
        "user_session",
        JSON.stringify(updatedSession),
      );
      setSession(updatedSession);
      setShowEditProfileModal(false);
      Alert.alert(
        "บันทึกสำเร็จ",
        "ข้อมูลโปรไฟล์ของคุณถูกปรับปรุงเรียบร้อยแล้ว",
      );
    } catch (err: any) {
      console.error("Error saving profile updates:", err);
      Alert.alert(
        "ไม่สามารถบันทึกได้",
        err?.message || "เกิดข้อผิดพลาดขณะบันทึกข้อมูลโปรไฟล์",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveProfile = () => {
    if (!editFullName.trim() || !editFamilyName.trim() || !editEmail.trim()) {
      Alert.alert(
        "ข้อผิดพลาด",
        "กรุณากรอกชื่อผู้ใช้งาน ชื่อครอบครัว และอีเมลให้ครบถ้วน",
      );
      return;
    }
    if (!validateEmail(editEmail)) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง");
      return;
    }
    if (editPassword || editConfirmPassword) {
      if (editPassword !== editConfirmPassword) {
        Alert.alert("ข้อผิดพลาด", "รหัสผ่านกับยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }
      if (editPassword.length < 6) {
        Alert.alert("ข้อผิดพลาด", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
        return;
      }
    }

    Alert.alert("ยืนยันการบันทึก", "คุณต้องการบันทึกการแก้ไขโปรไฟล์หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "บันทึก", onPress: saveProfileUpdates },
    ]);
  };

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    const sessionStr = await AsyncStorage.getItem("user_session");
    if (sessionStr) {
      const parsedSession = JSON.parse(sessionStr);
      setSession(parsedSession);
      setAvatarUri(
        parsedSession?.profile?.avatar_url ??
          parsedSession?.user?.user_image_url ??
          null,
      );
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.push("/(auth)/login");
  };

  const saveAvatar = async (uri: string, publicUrl: string) => {
    const storedSession = await AsyncStorage.getItem("user_session");
    if (!storedSession) {
      return;
    }

    const updatedSession = JSON.parse(storedSession);
    if (!updatedSession.profile) {
      updatedSession.profile = {};
    }

    updatedSession.profile.avatar_url = publicUrl;
    updatedSession.user = {
      ...updatedSession.user,
      user_image_url: publicUrl,
    };

    await AsyncStorage.setItem("user_session", JSON.stringify(updatedSession));
    setSession(updatedSession);
    setAvatarUri(publicUrl);
  };

  const base64ToUint8Array = (base64: string) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i += 1) {
      lookup[chars.charCodeAt(i)] = i;
    }
    lookup["=".charCodeAt(0)] = 64;

    const len = base64.length;
    let placeHolders = 0;
    if (base64[len - 1] === "=") placeHolders += 1;
    if (base64[len - 2] === "=") placeHolders += 1;

    const arr = new Uint8Array((len * 3) / 4 - placeHolders);
    let index = 0;

    for (let i = 0; i < len; i += 4) {
      const encode1 = lookup[base64.charCodeAt(i)];
      const encode2 = lookup[base64.charCodeAt(i + 1)];
      const encode3 = lookup[base64.charCodeAt(i + 2)];
      const encode4 = lookup[base64.charCodeAt(i + 3)];

      arr[index++] = (encode1 << 2) | (encode2 >> 4);
      if (encode3 !== 64) {
        arr[index++] = ((encode2 & 15) << 4) | (encode3 >> 2);
      }
      if (encode4 !== 64) {
        arr[index++] = ((encode3 & 3) << 6) | encode4;
      }
    }

    return arr;
  };

  const getFileExtension = (uri: string) => {
    const cleanUri = uri.split("?")[0];
    const parts = cleanUri.split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "jpg";
  };

  const uploadProfileImage = async (localUri: string) => {
    const storedSession = await AsyncStorage.getItem("user_session");
    if (!storedSession) {
      return;
    }
    const parsedSession = JSON.parse(storedSession);
    const userId = parsedSession?.user?.id;
    if (!userId) {
      Alert.alert("ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้งาน");
      return;
    }

    try {
      const fileExtension = getFileExtension(localUri);
      const filePath = `avatars/${userId}.${fileExtension}`;
      const fileInfo = await FileSystem.readAsStringAsync(localUri, {
        encoding: "base64",
      });
      const fileBuffer = base64ToUint8Array(fileInfo);
      const contentType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("user_bk")
        .upload(filePath, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("user_bk")
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("user_tb")
        .update({ user_image_url: publicUrl })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      await saveAvatar(localUri, publicUrl);
      await loadSession();
    } catch (err: any) {
      console.error("Upload profile image error:", err);
      Alert.alert(
        "ไม่สามารถบันทึกรูปโปรไฟล์ได้",
        err?.message || "เกิดข้อผิดพลาดขณะอัปโหลดรูปภาพ",
      );
    }
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("โปรดให้สิทธิ์การเข้าถึงรูปภาพเพื่อเพิ่มรูปโปรไฟล์");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.length > 0) {
      void uploadProfileImage(result.assets[0].uri);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={pickProfileImage}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(
                  session?.profile?.first_name
                    ? `${session.profile.first_name} ${session.profile.last_name || ""}`
                    : session?.user?.fullname || "User",
                )}
              </Text>
            </View>
          )}
          <View style={styles.editIconWrapper}>
            <MaterialCommunityIcons
              name="pencil"
              size={18}
              color={Theme.colors.onPrimary}
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>
          {session?.profile?.first_name
            ? `${session.profile.first_name} ${session.profile.last_name || ""}`
            : session?.user?.fullname || "ผู้ใช้งาน"}
        </Text>
        <Text style={styles.familyText}>
          {session?.family?.name
            ? `ครอบครัว ${session.family.name}`
            : "ยังไม่มีครอบครัว"}
        </Text>
      </View>

      {/* Settings Options */}
      <Text style={styles.sectionTitle}>การจัดการครอบครัว</Text>
      <View style={styles.cardGroup}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={handleOpenEditProfile}
        >
          <MaterialCommunityIcons
            name="account-edit-outline"
            size={24}
            color={Theme.colors.primary}
          />
          <Text style={styles.optionText}>แก้ไขโปรไฟล์</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={Theme.colors.outlineVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/add-member")}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={24}
            color={Theme.colors.primary}
          />
          <Text style={styles.optionText}>สมาชิกครอบครัว</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={Theme.colors.outlineVariant}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/notification")}
        >
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={24}
            color={Theme.colors.primary}
          />
          <Text style={styles.optionText}>การแจ้งเตือนของหมด</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={Theme.colors.outlineVariant}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>แก้ไขโปรไฟล์</Text>
            <Text style={styles.modalSubtitle}>
              แก้ไขชื่อผู้ใช้งาน ชื่อครอบครัว อีเมล หรือรหัสผ่าน แล้วกดบันทึก
            </Text>

            <Text style={styles.formLabel}>ชื่อผู้ใช้งาน</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อเต็ม"
              value={editFullName}
              onChangeText={setEditFullName}
              returnKeyType="next"
            />

            <Text style={styles.formLabel}>ชื่อครอบครัว</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อครอบครัว"
              value={editFamilyName}
              onChangeText={setEditFamilyName}
              returnKeyType="next"
            />

            <Text style={styles.formLabel}>อีเมล</Text>
            <TextInput
              style={styles.input}
              placeholder="example@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={editEmail}
              onChangeText={setEditEmail}
              returnKeyType="next"
            />

            <Text style={styles.formLabel}>รหัสผ่านใหม่</Text>
            <TextInput
              style={styles.input}
              placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
              secureTextEntry
              value={editPassword}
              onChangeText={setEditPassword}
              returnKeyType="done"
            />

            <Text style={styles.formLabel}>ยืนยันรหัสผ่าน</Text>
            <TextInput
              style={styles.input}
              placeholder="ยืนยันรหัสผ่าน"
              secureTextEntry
              value={editConfirmPassword}
              onChangeText={setEditConfirmPassword}
              returnKeyType="done"
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.modalButton]}
                onPress={() => setShowEditProfileModal(false)}
                disabled={saveLoading}
              >
                <Text style={styles.secondaryButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  styles.modalButton,
                  saveLoading && styles.disabledButton,
                ]}
                onPress={handleSaveProfile}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.sectionTitle}>ระบบ</Text>
      <View style={styles.cardGroup}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push("/privacy-policy")}
        >
          <MaterialCommunityIcons
            name="shield-lock-outline"
            size={24}
            color={Theme.colors.primary}
          />
          <Text style={styles.optionText}>ความเป็นส่วนตัว</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={Theme.colors.outlineVariant}
          />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>ออกจากระบบ (Sign Out)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  content: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
    marginTop: Theme.spacing.lg,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    marginBottom: Theme.spacing.md,
  },
  avatar: {
    flex: 1,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: Theme.colors.onPrimaryFixedVariant,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: Theme.rounding.full,
  },
  editIconWrapper: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Theme.colors.surface,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.onSurface,
  },
  familyText: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.onSurfaceVariant,
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.sm,
  },
  cardGroup: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.rounding.xl,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.xl,
    // Soft shadow instead of borders
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.md,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.onSurface,
    marginLeft: Theme.spacing.md,
  },
  logoutButton: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounding.full,
    alignItems: "center",
    marginTop: Theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: Theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounding.xl,
    padding: Theme.spacing.lg,
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.sm,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: Theme.spacing.md,
  },
  formLabel: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: Theme.spacing.xs,
    marginTop: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.rounding.lg,
    padding: Theme.spacing.md,
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.sm,
  },
  rowInputs: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounding.full,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: Theme.colors.onPrimary,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounding.full,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: Theme.colors.primary,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  logoutText: {
    color: Theme.colors.error,
    fontSize: 16,
    fontWeight: "700",
  },
});
