import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, Image, TouchableOpacity, SafeAreaView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';
import { logger } from '../utils/logger';
import API_URL from '../backendurl'; // Import API_URL

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      logger.info('Firebase user created', { uid: user.uid, email: user.email });

      // Get ID token after Firebase Auth creation
      const idToken = await user.getIdToken();

      logger.debug('Sending createUser request to backend');
      await axios.post(
        `${API_URL}/user/createUser`,
        { uid: user.uid, email: user.email },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      logger.info('User created in backend', { uid: user.uid });

      Alert.alert('Success', 'Account created successfully!');
      // router.replace('/(tabs)/home');
    } catch (error: any) {
      let errorMessage = 'Signup failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>

        <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
          Create Account
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
            marginBottom: 15
          }}
        />

        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
          onPress={handleSignUp}
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
              Sign Up
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signin')}>
          <Text style={{ textAlign: 'center', color: '#666' }}>
            Already have an account?{' '}
            <Text style={{ color: 'black', fontWeight: '600' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}