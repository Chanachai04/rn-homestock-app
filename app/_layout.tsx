import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { Theme } from "../constants/theme";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<"(auth)" | "(tabs)">("(auth)");

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem("user_session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session?.user?.id) {
          setInitialRoute("(tabs)");
        } else {
          setInitialRoute("(auth)");
        }
      } else {
        setInitialRoute("(auth)");
      }
    } catch (error) {
      console.error("Error checking session:", error);
      setInitialRoute("(auth)");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Theme.colors.surface,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
