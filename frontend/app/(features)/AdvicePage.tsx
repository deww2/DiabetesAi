import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { auth } from '../../firebase';
import { logger } from '../../utils/logger';
import API_URL from '../../backendurl';

interface HealthAdvice {
  general_recommendations: string;
  exercise_suggestions: string;
  dietary_advice: string;
  health_risks: string;
  lifestyle_tips: string;
}

const AdvicePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [healthAdvice, setHealthAdvice] = useState<HealthAdvice | null>(null);

  useEffect(() => {
    logger.debug('AdvicePage mounted');
    fetchHealthAdvice();
  }, []);

  const fetchHealthAdvice = async () => {
    try {
      logger.info('Fetching health advice');
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();
      
      logger.debug('Sending request to fetch health advice');
      const response = await axios.get(`${API_URL}/health/advice`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const adviceData = JSON.parse(response.data.advice)[0];
      logger.info('Health advice received', {
        hasAdvice: !!adviceData,
        timestamp: adviceData?.timestamp
      });
      
      setHealthAdvice(adviceData);
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info('No existing advice found');
        setHealthAdvice(null);
      } else {
        logger.error('Error fetching health advice', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        Alert.alert('Error', error.response?.data?.error || 'Failed to fetch health advice');
      }
    } finally {
      setLoading(false);
      logger.debug('Health advice fetch completed');
    }
  };

  const generateNewAdvice = async () => {
    try {
      logger.info('Generating new health advice');
      setGenerating(true);
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();
      
      logger.debug('Sending request to generate new health advice');
      const response = await axios.post(`${API_URL}/health/advice`, {}, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const adviceData = JSON.parse(response.data.advice)[0];
      logger.info('New health advice generated', {
        hasAdvice: !!adviceData,
        timestamp: adviceData?.timestamp
      });
      
      setHealthAdvice(adviceData);
      Alert.alert('Success', 'New health advice generated successfully');
    } catch (error: any) {
      logger.error('Error generating new health advice', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate new health advice');
    } finally {
      setGenerating(false);
      logger.debug('Health advice generation completed');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading health advice...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {!healthAdvice ? (
        <View style={styles.noAdviceContainer}>
          <Text style={styles.noAdviceText}>No health advice available</Text>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={generateNewAdvice}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate New Advice</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={generateNewAdvice}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>Generate New Advice</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.adviceContainer}>
            <View style={styles.adviceSection}>
              <Text style={styles.adviceSubtitle}>General Recommendations</Text>
              <Text style={styles.adviceText}>{healthAdvice.general_recommendations}</Text>
            </View>

            <View style={styles.adviceSection}>
              <Text style={styles.adviceSubtitle}>Exercise Suggestions</Text>
              <Text style={styles.adviceText}>{healthAdvice.exercise_suggestions}</Text>
            </View>

            <View style={styles.adviceSection}>
              <Text style={styles.adviceSubtitle}>Dietary Advice</Text>
              <Text style={styles.adviceText}>{healthAdvice.dietary_advice}</Text>
            </View>

            <View style={styles.adviceSection}>
              <Text style={styles.adviceSubtitle}>Health Risks</Text>
              <Text style={styles.adviceText}>{healthAdvice.health_risks}</Text>
            </View>

            <View style={styles.adviceSection}>
              <Text style={styles.adviceSubtitle}>Lifestyle Tips</Text>
              <Text style={styles.adviceText}>{healthAdvice.lifestyle_tips}</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default AdvicePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  noAdviceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noAdviceText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adviceContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  adviceSection: {
    marginBottom: 20,
  },
  adviceSubtitle: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  adviceText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});
