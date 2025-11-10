import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          Features
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "black",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginBottom: 12,
          }}
          onPress={() => router.push("/AdvicePage")}
        >
          <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
            Advice
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "black",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginBottom: 12,
          }}
          onPress={() => router.push("/CalculateMetricsPage")}
        >
          <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
            Calculate Metrics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "black",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginBottom: 12,
          }}
          onPress={() => router.push("/ChatPage")}
        >
          <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "black",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginBottom: 12,
          }}
          onPress={() => router.push("/DiabetesCheckPage")}
        >
          <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
            Diabetes Check
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "black",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginBottom: 12,
          }}
          onPress={() => router.push("/DietPage")}
        >
          <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
            Diet Plan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "black",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginBottom: 12,
          }}
          onPress={() => router.push("/FoodRecipesPage")}
        >
          <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
            Food Recipes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "black",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginBottom: 12,
          }}
          onPress={() => router.push("/PlanPage")}
        >
          <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
            Plan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "black",
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginBottom: 12,
          }}
          onPress={() => router.push("/UserPage")}
        >
          <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
            User Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
