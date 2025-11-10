import React, { useState, useEffect } from 'react';
import { TextInput, Button, Alert, StyleSheet, Text, ScrollView, Switch, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Ensure you install this library
import {auth} from '../../firebase';
import axios from 'axios';
import { logger } from '../../utils/logger';
import API_URL from '../../backendurl'; // Import API_URL

interface UserForm {
  age: string;
  sex: string;
  height: string;
  weight: string;
  activity_level: string;
  goal: string;
  ethnicity: string;
  vegan: boolean;
  location: string;
  race: string;
  hypertension: string;
  heart_disease: string;
  smoking_history: string;
  hba1c: string;
  blood_glucose: string;
}

interface UserProfile {
  email?: string;
  display_name?: string;
  age?: number;
  sex?: string;
  height?: number;
  weight?: number;
  activity_level?: string;
  goal?: string;
  ethnicity?: string;
  vegan?: boolean;
  location?: string;
  race?: string;
  hypertension?: boolean;
  heart_disease?: boolean;
  smoking_history?: string;
  hba1c?: number;
  blood_glucose?: number;
  created_at?: any;
  last_login?: any;
}

const UserPage: React.FC = () => {
  const [userData, setUserData] = useState<UserForm>({
    age: '',
    sex: '',
    height: '',
    weight: '',
    activity_level: '',
    goal: '',
    ethnicity: '',
    vegan: false,
    location: '',
    race: '',
    hypertension: '',
    heart_disease: '',
    smoking_history: '',
    hba1c: '',
    blood_glucose: '',
  });
  const [isLoading, setIsLoading] = useState(false); // Used for saving process
  const [loading, setLoading] = useState(true); // Used for initial fetch process
  const [profile, setProfile] = useState<UserProfile | null>(null); // Kept for reference if needed

  useEffect(() => {
    logger.debug('UserPage mounted');
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      logger.info('Fetching user profile');
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();
      
      logger.debug('Sending request to fetch user profile');
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      logger.info('User profile received', {
        hasProfile: !!response.data,
        email: response.data?.email
      });
      
      const fetchedProfile: UserProfile = response.data;
      setProfile(fetchedProfile); // Keep profile state for other uses if any

      // Populate UserForm from fetchedProfile
      setUserData({
        age: fetchedProfile.age?.toString() || '',
        sex: fetchedProfile.sex || '',
        height: fetchedProfile.height?.toString() || '',
        weight: fetchedProfile.weight?.toString() || '',
        activity_level: fetchedProfile.activity_level || '',
        goal: fetchedProfile.goal || '', // Convert array to string
        ethnicity: fetchedProfile.ethnicity || '',
        vegan: fetchedProfile.vegan || false,
        location: fetchedProfile.location || '',
        race: fetchedProfile.race || '',
        hypertension: fetchedProfile.hypertension ? 'Yes' : 'No',
        heart_disease: fetchedProfile.heart_disease ? 'Yes' : 'No',
        smoking_history: fetchedProfile.smoking_history || '',
        hba1c: fetchedProfile.hba1c?.toString() || '',
        blood_glucose: fetchedProfile.blood_glucose?.toString() || '',
      });

    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info('No existing user profile found, starting with empty form');
        // No profile found, keep form empty (initial state)
      } else {
        logger.error('Error fetching user profile', {
          errorMessage: error.message,
          responseData: error.response?.data,
          statusCode: error.response?.status
        });
        Alert.alert('Error', error.response?.data?.error || 'Failed to fetch user profile');
      }
    } finally {
      setLoading(false);
      logger.debug('User profile fetch completed');
    }
  };

  const handleInputChange = (field: keyof UserForm, value: string | boolean) => {
    logger.debug('Input changed', { field, value });
    setUserData((prev) => ({ ...prev, [field]: value }));
    logger.debug('User data updated', { userData });
  };

const handleSave = async () => {
  try {
    setIsLoading(true);
    logger.info('Saving user data', { userData });

    // Prepare data for backend (convert UserForm to UserProfile structure)
    const dataToSend: Partial<UserProfile> = {
      age: userData.age ? parseInt(userData.age) : undefined,
      sex: userData.sex || undefined,
      height: userData.height ? parseFloat(userData.height) : undefined,
      weight: userData.weight ? parseFloat(userData.weight) : undefined,
      activity_level: userData.activity_level || undefined,
      goal: userData.goal || undefined,
      ethnicity: userData.ethnicity || undefined,
      vegan: userData.vegan,
      location: userData.location || undefined,
      race: userData.race || undefined,
      hypertension: userData.hypertension === 'Yes',
      heart_disease: userData.heart_disease === 'Yes',
      smoking_history: userData.smoking_history || undefined,
      hba1c: userData.hba1c ? parseFloat(userData.hba1c) : undefined,
      blood_glucose: userData.blood_glucose ? parseFloat(userData.blood_glucose) : undefined,
    };

    const user = auth.currentUser;
    if (!user) {
      logger.error('No authenticated user found for saving');
      throw new Error('No user signed in.');
    }

    logger.debug('Getting ID token for user', { uid: user.uid });
    const idToken = await user.getIdToken();



    logger.debug('Sending update request to backend', { dataToSend });
    const response = await axios.put(
      `${API_URL}/user/profile`,
      dataToSend,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info('User data saved successfully', { responseData: response.data });
    Alert.alert('Success', response.data.message || 'User data saved successfully!');
    // Optionally re-fetch profile to ensure UI is in sync with backend after save
    // fetchUserProfile();
  } catch (error: any) {
    logger.error('Error saving user data', {
      errorMessage: error.message,
      responseData: error.response?.data,
      statusCode: error.response?.status
    });
    Alert.alert('Error', error.response?.data?.error || 'An error occurred while saving data');
  } finally {
    setIsLoading(false);
    logger.debug('User data save process completed');
  }
};

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.label}>Age:</Text>
      <TextInput
        placeholder="Enter your age"
        placeholderTextColor="#aaa"
        style={styles.input}
        keyboardType="numeric"
        value={userData.age}
        onChangeText={(text) => handleInputChange('age', text)}
      />

      <Text style={styles.label}>Sex:</Text>
      <Picker
        selectedValue={userData.sex}
        onValueChange={(value: string) => handleInputChange('sex', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select" value="" />
        <Picker.Item label="Male" value="Male" />
        <Picker.Item label="Female" value="Female" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      <Text style={styles.label}>Height (cm):</Text>
      <TextInput
        placeholder="Enter your height"
        placeholderTextColor="#aaa"
        style={styles.input}
        keyboardType="numeric"
        value={userData.height}
        onChangeText={(text) => handleInputChange('height', text)}
      />

      <Text style={styles.label}>Weight (kg):</Text>
      <TextInput
        placeholder="Enter your weight"
        placeholderTextColor="#aaa"
        style={styles.input}
        keyboardType="numeric"
        value={userData.weight}
        onChangeText={(text) => handleInputChange('weight', text)}
      />

      <Text style={styles.label}>Activity Level:</Text>
      <Picker
        selectedValue={userData.activity_level}
        onValueChange={(value: string) => handleInputChange('activity_level', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select" value="" />
        <Picker.Item label="Sedentary" value="Sedentary" />
        <Picker.Item label="Lightly Active" value="Lightly Active" />
        <Picker.Item label="Moderately Active" value="Moderately Active" />
        <Picker.Item label="Very Active" value="Very Active" />
      </Picker>

      <Text style={styles.label}>Goal:</Text>
      <Picker
        selectedValue={userData.goal}
        onValueChange={(value: string) => handleInputChange('goal', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select" value="" />
        <Picker.Item label="Lose Weight" value="Lose Weight" />
        <Picker.Item label="Maintain Weight" value="Maintain Weight" />
        <Picker.Item label="Gain Muscle" value="Gain Muscle" />
      </Picker>

      <Text style={styles.label}>Ethnicity:</Text>
      <Picker
        selectedValue={userData.ethnicity}
        onValueChange={(value: string) => handleInputChange('ethnicity', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select" value="" />
        <Picker.Item label="Asian" value="Asian" />
        <Picker.Item label="African" value="African" />
        <Picker.Item label="Caucasian" value="Caucasian" />
        <Picker.Item label="Hispanic" value="Hispanic" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Vegan:</Text>
        <Switch
          value={userData.vegan}
          onValueChange={(value) => handleInputChange('vegan', value)}
        />
      </View>

      <Text style={styles.label}>Location:</Text>
      <TextInput
        placeholder="Enter your location"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={userData.location}
        onChangeText={(text) => handleInputChange('location', text)}
      />

      <Text style={styles.label}>Race:</Text>
      <Picker
        selectedValue={userData.race}
        onValueChange={(value: string) => handleInputChange('race', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select" value="" />
        <Picker.Item label="Asian" value="Asian" />
        <Picker.Item label="African" value="African" />
        <Picker.Item label="Caucasian" value="Caucasian" />
        <Picker.Item label="Hispanic" value="Hispanic" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      <Text style={styles.label}>Hypertension:</Text>
      <Picker
        selectedValue={userData.hypertension}
        onValueChange={(value: string) => handleInputChange('hypertension', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select" value="" />
        <Picker.Item label="Yes" value="Yes" />
        <Picker.Item label="No" value="No" />
      </Picker>

      <Text style={styles.label}>Heart Disease:</Text>
      <Picker
        selectedValue={userData.heart_disease}
        onValueChange={(value: string) => handleInputChange('heart_disease', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select" value="" />
        <Picker.Item label="Yes" value="Yes" />
        <Picker.Item label="No" value="No" />
      </Picker>

      <Text style={styles.label}>Smoking History:</Text>
      <Picker
        selectedValue={userData.smoking_history}
        onValueChange={(value: string) => handleInputChange('smoking_history', value)}
        style={styles.picker}
      >
        <Picker.Item label="Select" value="" />
        <Picker.Item label="Never" value="never" />
        <Picker.Item label="Former" value="former" />
        <Picker.Item label="Current" value="current" />
      </Picker>

      <Text style={styles.label}>HbA1c (%):</Text>
      <TextInput
        placeholder="Enter your HbA1c level"
        placeholderTextColor="#aaa"
        style={styles.input}
        keyboardType="numeric"
        value={userData.hba1c}
        onChangeText={(text) => handleInputChange('hba1c', text)}
      />

      <Text style={styles.label}>Blood Glucose (mg/dL):</Text>
      <TextInput
        placeholder="Enter your blood glucose level"
        placeholderTextColor="#aaa"
        style={styles.input}
        keyboardType="numeric"
        value={userData.blood_glucose}
        onChangeText={(text) => handleInputChange('blood_glucose', text)}
      />

      <Button 
        title={isLoading ? "Saving..." : "Save User Data"} 
        onPress={handleSave} 
        color="#000"
        disabled={isLoading}
      />
    </ScrollView>
  );
};

export default UserPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Light background
  },
  label: {
    fontSize: 16,
    marginVertical: 8,
    color: '#000', // Black text color
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    color: '#000', // Black text
    backgroundColor: '#fff', // White input background
  },
  picker: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10,
    borderRadius: 5,
    color: '#000', // Black text
    backgroundColor: '#fff', // White picker background
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});