import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/Theme";

export default function SettingsScreen() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    const sessionStr = await AsyncStorage.getItem("user_session");
    if (sessionStr) {
      setSession(JSON.parse(sessionStr));
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/(auth)/login");
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(
              session?.profile?.first_name
                ? `${session.profile.first_name} ${session.profile.last_name || ""}`
                : session?.user?.fullname || "User",
            )}
          </Text>
        </View>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Theme.rounding.full,
    backgroundColor: Theme.colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: Theme.colors.onPrimaryFixedVariant,
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
  logoutText: {
    color: Theme.colors.error,
    fontSize: 16,
    fontWeight: "700",
  },
});
