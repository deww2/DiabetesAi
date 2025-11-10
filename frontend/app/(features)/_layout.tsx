import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Home" }}
      />
      <Stack.Screen name="AdvicePage" options={{ title: "Advice" }} />
      <Stack.Screen
        name="CalculateMetricsPage"
        options={{ title: "Calculate Metrics" }}
      />
      <Stack.Screen name="ChatPage" options={{ title: "Chat" }} />
      <Stack.Screen
        name="DiabetesCheckPage"
        options={{ title: "Diabetes Check" }}
      />
      <Stack.Screen name="DietPage" options={{ title: "Diet" }} />
      <Stack.Screen
        name="FoodRecipesPage"
        options={{ title: "Food Recipers" }}
      />
      <Stack.Screen name="PlanPage" options={{ title: "Plan" }} />
      <Stack.Screen name="UserPage" options={{ title: "Profile" }} />
    </Stack>
  );
}
