import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { auth } from '../../firebase';
import { logger } from '../../utils/logger';
import API_URL from '../../backendurl';

interface MacroBreakdown {
  nutrient: string;
  amount: string;
}

interface DietPlan {
  meals: {
    name: string;
    foods: string[];
    calories: number;
  }[];
  total_calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

const DietPage: React.FC = () => {
  const [foodItem, setFoodItem] = useState('');
  const [macros, setMacros] = useState<MacroBreakdown[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    logger.info('DietPage component mounted');
    logger.debug('Initial state', {
      foodItem: '',
      macrosCount: 0,
      generating: false
    });
  }, []);

  const handleFoodItemChange = (text: string) => {
    logger.debug('Food item input changed', { 
      previousValue: foodItem,
      newValue: text,
      length: text.length
    });
    setFoodItem(text);
  };

  const handleGetMacros = async () => {
    logger.info('Starting macro breakdown generation', { foodItem });

    if (!foodItem.trim()) {
      logger.warn('Empty food item submitted');
      Alert.alert('Error', 'Food item cannot be empty');
      return;
    }

    try {
      logger.debug('Setting generating state to true');
      setGenerating(true);
      
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();

      logger.debug('Sending macro breakdown request', {
        endpoint: `${API_URL}/food/diet`,
        foodItem,
        userId: user.uid
      });

      const response = await axios.post(
        `${API_URL}/food/diet`,
        { food_item: foodItem },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      logger.debug('Received macro breakdown response', {
        status: response.status,
        hasData: !!response.data,
        dataLength: response.data?.macro_breakdown?.length
      });

      const parsedMacros = JSON.parse(response.data.macro_breakdown);
      logger.info('Successfully parsed macro breakdown', {
        macroCount: parsedMacros.length,
        macros: parsedMacros
      });

      setMacros(parsedMacros);
      Alert.alert('Success', 'Macro breakdown generated successfully');
    } catch (error: any) {
      logger.error('Error generating macro breakdown', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate macro breakdown');
    } finally {
      logger.debug('Setting generating state to false');
      setGenerating(false);
      logger.info('Macro breakdown generation process completed');
    }
  };

  const renderTableHeader = () => {
    logger.debug('Rendering table header');
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.headerCell]}>Nutrient</Text>
        <Text style={[styles.tableCell, styles.headerCell]}>Amount</Text>
      </View>
    );
  };

  const renderTableRows = () => {
    logger.debug('Rendering table rows', { rowCount: macros.length });
    return macros.map((macro, index) => (
      <View key={index} style={styles.tableRow}>
        <Text style={styles.tableCell}>{macro.nutrient}</Text>
        <Text style={styles.tableCell}>{macro.amount}</Text>
      </View>
    ));
  };

  logger.debug('Rendering DietPage component', {
    hasMacros: macros.length > 0,
    isGenerating: generating,
    foodItemLength: foodItem.length
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter Food Item"
          placeholderTextColor="#999"
          style={styles.input}
          onChangeText={handleFoodItemChange}
          value={foodItem}
        />
        <TouchableOpacity 
          style={[styles.generateButton, generating && styles.disabledButton]}
          onPress={handleGetMacros}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Get Macro Breakdown</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {macros.length > 0 && (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          {renderTableRows()}
        </View>
      )}
    </ScrollView>
  );
};

export default DietPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
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
});