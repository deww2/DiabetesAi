import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Signin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/(features)")
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 }}>
          Welcome Back
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 15,
            borderRadius: 10,
            marginBottom: 15
          }}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 15,
            borderRadius: 10,
            marginBottom: 30
          }}
        />

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#999' : '#000',
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginBottom: 20
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={{ textAlign: 'center', color: '#666' }}>
            Don't have an account?{' '}
            <Text style={{ color: 'black', fontWeight: '600' }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}