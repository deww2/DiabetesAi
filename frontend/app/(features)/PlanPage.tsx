import React, { useState, useEffect } from 'react';
import { View, TextInput, Alert, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { auth } from '../../firebase';
import { logger } from '../../utils/logger';
import API_URL from '../../backendurl';

interface MealPlan {
  mealtime: string;
  foodItem: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface PlanResponse {
  plan: string;
  plan_id: string;
  created_at: string;
}

interface WorkoutPlan {
  exercises: {
    name: string;
    sets: number;
    reps: number;
    rest: number;
  }[];
  duration: number;
  difficulty: string;
  target_muscles: string[];
}

const PlanPage: React.FC = () => {
  const [preferences, setPreferences] = useState('');
  const [plan, setPlan] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [planHistory, setPlanHistory] = useState<PlanResponse[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    logger.debug('PlanPage mounted');
    fetchPlanHistory();
  }, []);

  const fetchPlanHistory = async () => {
    try {
      logger.info('Fetching plan history');
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();
      
      logger.debug('Sending request to fetch plan history');
      const response = await axios.get(`${API_URL}/health/plan`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      logger.info('Plan history received', {
        hasPlan: !!response.data,
        planCount: response.data?.length
      });
      
      if (response.data) {
        setPlanHistory([response.data]);
        setPlan(JSON.parse(response.data.plan));
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info('No existing plan history found');
        setPlanHistory([]);
        setPlan([]);
      } else {
        logger.error('Error fetching plan history', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        Alert.alert('Error', error.response?.data?.error || 'Failed to fetch plan history');
      }
    } finally {
      setLoading(false);
      logger.debug('Plan history fetch completed');
    }
  };

  const handleGetPlan = async () => {
    if (!preferences.trim()) {
      Alert.alert('Error', 'Preferences cannot be empty');
      return;
    }

    try {
      logger.info('Generating new meal plan');
      setGenerating(true);

      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();

      logger.debug('Sending request to generate new meal plan');
      const response = await axios.post(
        `${API_URL}/health/plan`, 
        { preferences },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      logger.info('New meal plan generated', {
        hasPlan: !!response.data,
        planCount: response.data?.length
      });
      
      const parsedPlan = JSON.parse(response.data.plan);
      setPlan(parsedPlan);
      await fetchPlanHistory(); // Refresh history after new plan
      Alert.alert('Success', 'New meal plan generated successfully');
    } catch (error: any) {
      logger.error('Error generating new meal plan', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate meal plan');
    } finally {
      setGenerating(false);
      logger.debug('Meal plan generation completed');
    }
  };

  
  const renderTableHeader = () => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.headerCell]}>Meal Time</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Food Item</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Calories</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Protein</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Carbs</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Fat</Text>
    </View>
  );

  const renderTableRows = () => {
    return plan.map((meal, index) => (
      <View key={index} style={styles.tableRow}>
        <Text style={styles.tableCell}>{meal.mealtime}</Text>
        <Text style={styles.tableCell}>{meal.foodItem}</Text>
        <Text style={styles.tableCell}>{meal.calories}</Text>
        <Text style={styles.tableCell}>{meal.protein}g</Text>
        <Text style={styles.tableCell}>{meal.carbs}g</Text>
        <Text style={styles.tableCell}>{meal.fat}g</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading meal plan history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter Preferences"
          style={styles.input}
          onChangeText={setPreferences}
          value={preferences}
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity 
          style={[styles.generateButton, generating && styles.disabledButton]}
          onPress={handleGetPlan}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Meal Plan</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {plan.length > 0 && (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          {renderTableRows()}
        </View>
      )}

      {planHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Current Meal Plan</Text>
          <View style={styles.historyItem}>
            <Text style={styles.historyTimestamp}>
              Created: {new Date(planHistory[0].created_at).toLocaleString()}
            </Text>
            <Text style={styles.historyPlanId}>
              Plan ID: {planHistory[0].plan_id}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default PlanPage;

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
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    color: '#fff',
    backgroundColor: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  disabledButton: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#1e1e1e',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    padding: 8,
    color: '#fff',
    fontSize: 14,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  historyContainer: {
    marginTop: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 5,
    padding: 10,
  },
  historyTitle: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historyTimestamp: {
    color: '#fff',
    fontSize: 16,
  },
  historyPlanId: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
});
