import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView
} from "react-native";

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginTop: 16
          }}
        >
          Virtual Diabetes Guide
        </Text>

        <View style={{ marginTop: "auto", paddingHorizontal: 16, marginBottom: 16 }}>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: "black",
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 12,
              backgroundColor: "black"
            }}
            onPress={() => router.push("/signup")}
          >
            <Text style={{ color: "white", fontSize: 18, textAlign: "center" }}>
              Get Started
            </Text>
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}
