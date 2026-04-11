import AsyncStorage from "@react-native-async-storage/async-storage";

export type PeriodType = "weekly" | "monthly";
type NumericValue = number | string | null | undefined;

export interface FamilyInfo {
  id: string;
  name?: string;
  invite_code?: string | null;
}

export interface ProfileInfo {
  family_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface UserInfo {
  id: number;
  fullname?: string | null;
  email?: string | null;
}

export interface AppSession {
  user?: UserInfo | null;
  profile?: ProfileInfo | null;
  family?: FamilyInfo | null;
}

export interface ShoppingItem {
  id: string;
  family_id: string | null;
  name: string;
  quantity: number | null;
  is_purchased: boolean | null;
  created_at: string;
  period_type: PeriodType;
  period_day: number;
  notes: string | null;
  estimated_price: NumericValue;
  last_price: NumericValue;
  last_shop_name: string | null;
  last_purchased_at: string | null;
  purchased_at: string | null;
  updated_at: string;
  barcode: string | null;
  created_by: number | null;
  updated_by: number | null;
}

export interface PriceHistoryEntry {
  id: string;
  family_id: string;
  shopping_item_id: string | null;
  item_name: string;
  quantity: number;
  price: NumericValue;
  shop_name: string | null;
  purchased_at: string;
  notes: string | null;
  barcode: string | null;
  previous_price: NumericValue;
  price_difference: NumericValue;
  price_change_pct: NumericValue;
  price_trend: "first" | "up" | "down" | "same";
}

const weeklyLabels = [
  "ทุกวันจันทร์",
  "ทุกวันอังคาร",
  "ทุกวันพุธ",
  "ทุกวันพฤหัสบดี",
  "ทุกวันศุกร์",
  "ทุกวันเสาร์",
  "ทุกวันอาทิตย์",
];

export async function getStoredSession(): Promise<AppSession | null> {
  const sessionText = await AsyncStorage.getItem("user_session");

  if (!sessionText) {
    return null;
  }

  try {
    return JSON.parse(sessionText) as AppSession;
  } catch {
    return null;
  }
}

export function getFamilyIdFromSession(session: AppSession | null) {
  return session?.family?.id ?? session?.profile?.family_id ?? null;
}

export function toNumber(value: NumericValue) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function formatBaht(value: NumericValue) {
  const numericValue = toNumber(value);

  if (numericValue === null) {
    return "-";
  }

  return `฿${numericValue.toLocaleString("th-TH", {
    minimumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPeriodLabel(periodType: PeriodType, periodDay: number) {
  if (periodType === "monthly") {
    return `ทุกวันที่ ${periodDay} ของเดือน`;
  }

  return (
    weeklyLabels[Math.max(0, Math.min(periodDay - 1, 6))] ?? weeklyLabels[0]
  );
}

export function getEstimatedDelta(
  currentValue: NumericValue,
  previousValue: NumericValue,
) {
  const currentNumber = toNumber(currentValue);
  const previousNumber = toNumber(previousValue);

  if (currentNumber === null || previousNumber === null) {
    return null;
  }

  return Number((currentNumber - previousNumber).toFixed(2));
}

export function getEstimatedDeltaLabel(
  currentValue: NumericValue,
  previousValue: NumericValue,
) {
  const deltaValue = getEstimatedDelta(currentValue, previousValue);

  if (deltaValue === null) {
    return null;
  }

  if (deltaValue > 0) {
    return `แพงขึ้นจากครั้งก่อน ${formatBaht(deltaValue)}`;
  }

  if (deltaValue < 0) {
    return `ถูกลงจากครั้งก่อน ${formatBaht(Math.abs(deltaValue))}`;
  }

  return "ราคาใกล้เคียงครั้งก่อน";
}

export function getTrendMeta(
  entry: Pick<
    PriceHistoryEntry,
    "price_trend" | "price_difference" | "price_change_pct"
  >,
) {
  const differenceValue = toNumber(entry.price_difference);
  const percentValue = toNumber(entry.price_change_pct);

  if (entry.price_trend === "up") {
    return {
      icon: "trending-up",
      color: "#dc2626",
      label: `เพิ่มขึ้น ${formatBaht(differenceValue)}${percentValue === null ? "" : ` (${percentValue.toFixed(2)}%)`}`,
    };
  }

  if (entry.price_trend === "down") {
    return {
      icon: "trending-down",
      color: "#16a34a",
      label: `ลดลง ${formatBaht(Math.abs(differenceValue ?? 0))}${percentValue === null ? "" : ` (${Math.abs(percentValue).toFixed(2)}%)`}`,
    };
  }

  if (entry.price_trend === "same") {
    return {
      icon: "trending-neutral",
      color: "#2563eb",
      label: "ราคาเท่าครั้งก่อน",
    };
  }

  return {
    icon: "tag-outline",
    color: "#475569",
    label: "เป็นข้อมูลการซื้อครั้งแรก",
  };
}
