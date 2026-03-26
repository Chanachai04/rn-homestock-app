import { Redirect } from "expo-router";

export default function Index() {
  // สำหรับตอนออกแบบ UI รบกวนให้ Redirect ไปยังหน้า Login ก่อน
  return <Redirect href="/(auth)/login" />;
}
