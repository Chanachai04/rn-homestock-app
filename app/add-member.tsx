import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { Theme } from "../constants/Theme";
import { supabase } from "../utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AddMemberScreen() {
  const router = useRouter();

  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string>("ครอบครัวของฉัน");
  const [members, setMembers] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Code Generation
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);

  // Joining
  const [joinCode, setJoinCode] = useState("");
  const [loadingJoin, setLoadingJoin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setInitialLoading(true);
    try {
      let fid = await AsyncStorage.getItem("family_id");
      let sessionStr = await AsyncStorage.getItem("user_session");
      let session = sessionStr ? JSON.parse(sessionStr) : null;

      if (!fid && session) {
        fid = session?.family?.id || session?.profile?.family_id;
      }

      setFamilyId(fid);

      if (fid) {
        // Fetch Family Info
        const { data: familyObj } = await supabase
          .from("families_tb")
          .select("name, invite_code")
          .eq("id", fid)
          .single();

        if (familyObj) {
          setFamilyName(familyObj.name || "ครอบครัว");
          setInviteCode(familyObj.invite_code);
        }

        // Fetch Members
        const { data: memberList, error: memberError } = await supabase
          .from("profiles_tb")
          .select("user_id, first_name, last_name")
          .eq("family_id", fid);

        if (memberError) throw memberError;
        setMembers(memberList || []);
      } else {
        setMembers([]);
        setFamilyName("คุณยังไม่มีครอบครัว");
      }
    } catch (err: any) {
      console.log(`Error loading data: ${err.message}`);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!familyId) {
      Alert.alert("ข้อผิดพลาด", "คุณยังไม่มีครอบครัว กรุณาเข้าร่วมครอบครัวก่อน");
      return;
    }
    setLoadingGenerate(true);
    try {
      const newCode = Array.from({ length: 5 }, () =>
        Math.floor(Math.random() * 10)
      ).join("");

      const { error } = await supabase
        .from("families_tb")
        .update({ invite_code: newCode })
        .eq("id", familyId);

      if (error) {
        if (error.code === "23505") {
          Alert.alert("ข้อผิดพลาด", "รหัสซ้ำ กรุณากดสร้างใหม่อีกครั้ง");
        } else throw error;
      } else {
        setInviteCode(newCode);
      }
    } catch (err: any) {
      Alert.alert("เกิดข้อผิดพลาด", err.message);
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode || joinCode.length !== 5) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกรหัสเชิญชวน 5 หลักให้ถูกต้อง");
      return;
    }

    setLoadingJoin(true);
    try {
      const { data: family, error: familyError } = await supabase
        .from("families_tb")
        .select("id, name")
        .eq("invite_code", joinCode)
        .single();

      if (familyError || !family) {
        Alert.alert("ไม่พบข้อมูล", "รหัสเชิญชวนไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
        setLoadingJoin(false);
        return;
      }

      const sessionStr = await AsyncStorage.getItem("user_session");
      if (!sessionStr) throw new Error("ไม่พบข้อมูลผู้ใช้งาน");
      const session = JSON.parse(sessionStr);

      const { error: updateError } = await supabase
        .from("profiles_tb")
        .update({ family_id: family.id })
        .eq("user_id", session.user.id);

      if (updateError) throw updateError;

      const updatedSession = {
        ...session,
        profile: { ...session.profile, family_id: family.id },
        family: family,
      };

      await AsyncStorage.setItem("user_session", JSON.stringify(updatedSession));
      await AsyncStorage.setItem("family_id", family.id);

      Alert.alert("สำเร็จ!", `คุณได้เข้าร่วมครอบครัว "${family.name}" เรียบร้อยแล้ว`);
      setShowJoinModal(false);
      loadData();
    } catch (err: any) {
      Alert.alert("เกิดข้อผิดพลาด", err.message);
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleLeaveFamily = async () => {
    Alert.alert(
      "ยืนยันการออกจากครอบครัว",
      "คุณจะไม่สามารถเห็นข้อมูลของการจัดการของในบ้านนี้ได้อีก จนกว่าจะเข้าร่วมใหม่",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ออกจากครอบครัว",
          style: "destructive",
          onPress: async () => {
            try {
              const sessionStr = await AsyncStorage.getItem("user_session");
              if (!sessionStr) return;
              const session = JSON.parse(sessionStr);

              await supabase
                .from("profiles_tb")
                .update({ family_id: null })
                .eq("user_id", session.user.id);

              const updatedSession = {
                ...session,
                profile: { ...session.profile, family_id: null },
                family: null,
              };

              await AsyncStorage.setItem("user_session", JSON.stringify(updatedSession));
              await AsyncStorage.removeItem("family_id");

              Alert.alert("ออกจากครอบครัวเรียบร้อย");
              loadData();
            } catch (e: any) {
              Alert.alert("เกิดข้อผิดพลาด", e.message);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Theme.colors.onSurface} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {familyName}
      </Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerIconWrapper}
          onPress={() => setShowJoinModal(true)}
        >
          <MaterialCommunityIcons name="account-search" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerIconWrapper}
          onPress={() => setShowGenerateModal(true)}
        >
          <MaterialCommunityIcons name="qrcode-plus" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <View style={styles.content}>
        {initialLoading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
        ) : !familyId ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-group-outline" size={80} color={Theme.colors.outlineVariant} />
            <Text style={styles.emptyTitle}>คุณยังไม่มีครอบครัว</Text>
            <Text style={styles.emptyText}>
              กรุณากดปุ่มค้นหาที่มุมบนขวา เพื่อกรอกรหัสเข้าร่วมครอบครัวอื่น
            </Text>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.user_id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.memberCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(item.first_name)}</Text>
                </View>
                <Text style={styles.memberName}>
                  {item.first_name} {item.last_name || ""}
                </Text>
              </View>
            )}
            ListFooterComponent={
              <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveFamily}>
                <MaterialCommunityIcons name="exit-to-app" size={20} color={Theme.colors.error} />
                <Text style={styles.leaveButtonText}>ออกจากครอบครัว</Text>
              </TouchableOpacity>
            }
          />
        )}
      </View>

      {/* Generate Code Modal */}
      <Modal visible={showGenerateModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowGenerateModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={Theme.colors.onSurface} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>รหัสเชิญเข้าครอบครัว</Text>
            <Text style={styles.modalSubtitle}>ส่งรหัสนี้ให้ผู้อื่นเพื่อเพิ่มเข้าครอบครัวคุณ</Text>

            <View style={styles.codeCard}>
              {inviteCode ? (
                <View style={styles.codeContainer}>
                  {inviteCode.split("").map((digit, index) => (
                    <View key={index} style={styles.digitBox}>
                      <Text style={styles.digitText}>{digit}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noCodeText}>ยังไม่มีรหัสเชิญชวน</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loadingGenerate && styles.disabledButton]}
              onPress={handleGenerateCode}
              disabled={loadingGenerate || !familyId}
            >
              {loadingGenerate ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {inviteCode ? "สุ่มรหัสสร้างใหม่" : "สร้างรหัส 5 หลัก"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Family Modal */}
      <Modal visible={showJoinModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowJoinModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={Theme.colors.onSurface} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>เข้าร่วมครอบครัว</Text>
            <Text style={styles.modalSubtitle}>กรอกรหัสเชิญชวน 5 หลักที่ได้รับมาเพื่อเข้าร่วม</Text>

            <TextInput
              style={styles.inputCode}
              placeholder="12345"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
              value={joinCode}
              onChangeText={setJoinCode}
              keyboardType="numeric"
              maxLength={5}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.primaryButton, loadingJoin && styles.disabledButton]}
              onPress={handleJoinFamily}
              disabled={loadingJoin}
            >
              {loadingJoin ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>เข้าร่วมครอบครัว</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
  },
  headerIcon: {
    padding: Theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.onSurface,
    marginLeft: Theme.spacing.md,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerIconWrapper: {
    marginLeft: Theme.spacing.sm,
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.rounding.full,
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxl,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surfaceContainerLowest,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounding.lg,
    marginBottom: Theme.spacing.md,
    shadowColor: Theme.colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.colors.onPrimaryFixedVariant,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.onSurface,
    marginLeft: Theme.spacing.md,
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Theme.spacing.xl,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  leaveButtonText: {
    color: Theme.colors.error,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: Theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.onSurface,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xs,
  },
  emptyText: {
    fontSize: 16,
    color: Theme.colors.onSurfaceVariant,
    textAlign: "center",
  },
  // Modals styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.xl,
    borderTopLeftRadius: Theme.rounding.xl,
    borderTopRightRadius: Theme.rounding.xl,
    minHeight: 320,
  },
  modalClose: {
    alignSelf: "flex-end",
    padding: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.xs,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: Theme.spacing.xl,
    textAlign: "center",
  },
  codeCard: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.xl,
  },
  codeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  digitBox: {
    width: 48,
    height: 56,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.rounding.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  digitText: {
    fontSize: 28,
    fontWeight: "800",
    color: Theme.colors.primary,
  },
  noCodeText: {
    fontSize: 16,
    color: Theme.colors.onSurfaceVariant,
  },
  inputCode: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
    padding: Theme.spacing.lg,
    borderRadius: Theme.rounding.md,
    color: Theme.colors.onSurface,
    fontSize: 32,
    letterSpacing: 8,
    textAlign: "center",
    fontWeight: "800",
    marginBottom: Theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounding.full,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
