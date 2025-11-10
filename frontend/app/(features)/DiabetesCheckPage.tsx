import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { auth } from '../../firebase';
import { logger } from '../../utils/logger';
import API_URL from '../../backendurl';

interface DiabetesRisk {
  prediction: string;
  prediction_code: number;
  user_id: string;
}

const DiabetesCheckPage: React.FC = () => {
  const [result, setResult] = useState<DiabetesRisk | null>(null);
  const [checking, setChecking] = useState(false);

  const checkDiabetesRisk = async () => {
    try {
      logger.info('Starting diabetes risk assessment');

      setChecking(true);
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();

      logger.debug('Sending diabetes risk assessment request');
      const response = await axios.post(
        `${API_URL}/health/diabetes_check`,
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      logger.info('Diabetes risk assessment completed', {
        prediction: response.data.prediction,
        predictionCode: response.data.prediction_code,
        userId: response.data.user_id
      });

      setResult(response.data);
    } catch (error: any) {
      logger.error('Error checking diabetes risk', {
        errorMessage: error.message,
        responseData: error.response?.data,
        statusCode: error.response?.status
      });
      Alert.alert('Error', error.response?.data?.error || 'Failed to check diabetes risk');
    } finally {
      setChecking(false);
      logger.debug('Diabetes risk assessment process completed');
    }
  };

  const getPredictionColor = () => {
    if (!result) return '#666';
    return result.prediction === 'yes' ? '#ff4444' : '#4CAF50';
  };

  const getPredictionText = () => {
    if (!result) return '';
    return result.prediction === 'yes' ? 'High Risk' : 'Low Risk';
  };

  return (
    <View style={styles.container}>
      {checking ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Checking for Diabetes...</Text>
        </View>
      ) : result ? (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, { color: getPredictionColor() }]}>
            {getPredictionText()}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={checkDiabetesRisk}
          >
            <Text style={styles.buttonText}>Check Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={styles.infoText}>
            This assessment uses your health data from your profile to evaluate your diabetes risk.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={checkDiabetesRisk}
          >
            <Text style={styles.buttonText}>Check Diabetes Risk</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default DiabetesCheckPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#fff',
  },
  inputContainer: {
    padding: 20,
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
  },
  resultText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  probabilityText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
});
