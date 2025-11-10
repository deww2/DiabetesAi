import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { auth } from '../../firebase';
import { logger } from '../../utils/logger';
import API_URL from '../../backendurl';

interface Metrics {
  bmi: number;
  bmi_class: string;
  bmr: number;
  macros: {
    carbs: number;
    fat: number;
    protein: number;
  };
  tdee: number;
  user_id: string;
}

const CalculateMetricsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    fetchLatestMetrics();
  }, []);

  const fetchLatestMetrics = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user signed in.');
      }

      const idToken = await user.getIdToken();
      const response = await axios.get(`${API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.data.last_metrics) {
        setLatestMetrics(response.data.last_metrics);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to fetch latest metrics');
    }
  };

  const handleCalculate = async () => {
    try {
      logger.info('Starting metrics calculation');
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();

      logger.debug('Sending metrics calculation request');
      const response = await axios.post(
        `${API_URL}/health/calculate_metrics`,
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      logger.info('Metrics calculation completed', {
        hasMetrics: !!response.data,
        bmi: response.data.bmi,
        bmr: response.data.bmr
      });

      setMetrics(response.data);
      await fetchLatestMetrics(); // Refresh latest metrics after calculation
    } catch (error: any) {
      logger.error('Error calculating metrics', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert('Error', error.response?.data?.error || 'Failed to calculate metrics');
    } finally {
      setLoading(false);
      logger.debug('Metrics calculation process completed');
    }
  };

  const renderMetrics = (data: Metrics, title: string) => (
    <View style={styles.metricsContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>BMI:</Text>
        <Text style={styles.metricValue}>{data.bmi.toFixed(2)}</Text>
        <Text style={styles.metricClass}>({data.bmi_class})</Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>BMR:</Text>
        <Text style={styles.metricValue}>{data.bmr.toFixed(0)} kcal</Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>TDEE:</Text>
        <Text style={styles.metricValue}>{data.tdee.toFixed(0)} kcal</Text>
      </View>

      <Text style={styles.macroTitle}>Macronutrients:</Text>
      <View style={styles.macroContainer}>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroValue}>{data.macros.protein.toFixed(1)}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroValue}>{data.macros.carbs.toFixed(1)}g</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroValue}>{data.macros.fat.toFixed(1)}g</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Button 
        title="Calculate New Metrics" 
        onPress={handleCalculate}
        disabled={loading}
        color="#4CAF50"
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Calculating metrics...</Text>
        </View>
      )}

      {metrics && renderMetrics(metrics, 'Newly Calculated Metrics')}
      
      {latestMetrics && renderMetrics(latestMetrics, 'Latest Saved Metrics')}
    </ScrollView>
  );
};

export default CalculateMetricsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  metricsContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 15,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    color: '#fff',
    fontSize: 16,
    width: 80,
  },
  metricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricClass: {
    color: '#4CAF50',
    marginLeft: 10,
    fontSize: 14,
  },
  macroTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  macroLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  macroValue: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
