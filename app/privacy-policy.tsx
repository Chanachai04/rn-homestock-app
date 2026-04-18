import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../constants/theme";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
        <Text style={styles.headerTitle}>นโยบายความเป็นส่วนตัว</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. ข้อมูลที่เราเก็บรวบรวม</Text>
          <Text style={styles.paragraph}>
            HomeStock เก็บรวบรวมข้อมูลที่คุณให้ไว้เมื่อลงทะเบียนใช้งาน เช่น
            ชื่อ-นามสกุล, อีเมล
            และข้อมูลรายการสิ่งของที่คุณบันทึกไว้ในแอปพลิเคชัน
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. การใช้งานข้อมูล</Text>
          <Text style={styles.paragraph}>
            เราใช้ข้อมูลของคุณเพื่อวัตถุประสงค์ในการให้บริการแอปพลิเคชัน
            HomeStock รวมถึงการจัดการสต็อกสินค้าของคุณ การแจ้งเตือน
            และการปรับปรุงประสบการณ์การใช้งาน
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. การรักษาความปลอดภัย</Text>
          <Text style={styles.paragraph}>
            เราใช้มาตรการทางเทคนิคและการจัดการที่เหมาะสมเพื่อปกป้องข้อมูลส่วนบุคคลของคุณจากการเข้าถึงโดยไม่ได้รับอนุญาต
            การสูญหาย หรือการเปิดเผย
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. สิทธิส่วนบุคคล</Text>
          <Text style={styles.paragraph}>
            คุณมีสิทธิในการเข้าถึง แก้ไข
            หรือลบข้อมูลส่วนบุคคลของคุณได้ตลอดเวลาผ่านการตั้งค่าในแอปพลิเคชัน
            หรือติดต่อผู้พัฒนา
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>อัปเดตล่าสุด: 25 มีนาคม 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceContainerHigh,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.onSurface,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  section: {
    marginBottom: Theme.spacing.xl,
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounding.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Theme.colors.primary,
    marginBottom: Theme.spacing.sm,
  },
  paragraph: {
    fontSize: 15,
    color: Theme.colors.onSurface,
    lineHeight: 24,
  },
  footer: {
    marginTop: Theme.spacing.lg,
    alignItems: "center",
    paddingBottom: Theme.spacing.xl,
  },
  footerText: {
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
  },
});
