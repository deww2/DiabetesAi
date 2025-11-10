import React, { useState } from 'react';
import { View, Alert, StyleSheet, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { auth } from '../../firebase';
import { logger } from '../../utils/logger';
import API_URL from '../../backendurl'; // Import API_URL

interface Recipe {
  recipeName: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  ingredients: string;
}

const FoodRecipesPage: React.FC = () => {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [recipe, setRecipe] = useState<Recipe[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFilePick = async () => {
    try {
      logger.debug('Starting file pick process');
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      
      if (result.canceled) {
        logger.info('File pick was canceled by user');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        logger.error('No assets found in picker result', result);
        throw new Error('No file selected');
      }

      logger.info('File picked successfully', {
        name: result.assets[0].name,
        type: result.assets[0].mimeType,
        size: result.assets[0].size
      });
      
      setFile(result);
    } catch (error: any) {
      logger.error('Error in handleFilePick', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      Alert.alert('Error', 'Something went wrong while picking the document.');
    }
  };

  const handleUpload = async () => {
    if (!file?.assets || file.assets.length === 0) {
      logger.error('Upload attempted without file', file);
      Alert.alert('Error', 'No file selected');
      return;
    }

    const fileInfo = file.assets[0];
    logger.info('Starting upload process for file', {
      name: fileInfo.name,
      type: fileInfo.mimeType,
      size: fileInfo.size,
      uri: fileInfo.uri
    });

    try {
      setUploading(true);
      
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();
      
      logger.debug('Fetching file blob from URI');
      const response = await fetch(fileInfo.uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      logger.debug('File blob created', {
        size: blob.size,
        type: blob.type
      });

      const formData = new FormData();
      // formData.append('file', blob, fileInfo.name);
      formData.append('file', {
        uri: fileInfo.uri,
        name: fileInfo.name || 'uploaded-file.jpg', // Fallback filename
        type: fileInfo.mimeType || 'image/jpeg',   // Fallback MIME type
      } as unknown as Blob);
      logger.debug('FormData created with file');

      logger.debug('Sending upload request to backend');
      const uploadResponse = await axios.post(`${API_URL}/food/recipes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${idToken}`,
        },
      });

      logger.info('Server response received', {
        status: uploadResponse.status,
        hasRecipe: !!uploadResponse.data.recipe
      });

      const parsedRecipe = JSON.parse(uploadResponse.data.recipe);
      logger.info('Recipe parsed successfully', {
        recipeCount: parsedRecipe.length,
        firstRecipe: parsedRecipe[0]?.recipeName
      });

      setRecipe(parsedRecipe);
      Alert.alert('Success', 'Recipe generated successfully');
    } catch (error: any) {
      logger.error('Error in handleUpload', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        response: error.response?.data
      });
      
      let errorMessage = 'Failed to generate recipe';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
      logger.debug('Upload process completed');
    }
  };

  const renderTableHeader = () => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.headerCell]}>Recipe Name</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Calories</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Protein</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Fats</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Carbs</Text>
      <Text style={[styles.tableCell, styles.headerCell]}>Ingredients</Text>
    </View>
  );

  const renderTableRows = () => {
    return recipe.map((item, index) => (
      <View key={index} style={styles.tableRow}>
        <Text style={styles.tableCell}>{item.recipeName}</Text>
        <Text style={styles.tableCell}>{item.calories}</Text>
        <Text style={styles.tableCell}>{item.protein}g</Text>
        <Text style={styles.tableCell}>{item.fats}g</Text>
        <Text style={styles.tableCell}>{item.carbs}g</Text>
        <Text style={styles.tableCell}>{item.ingredients}</Text>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, !file && styles.disabledButton]}
          onPress={handleFilePick}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>Pick Image</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, (!file || uploading) && styles.disabledButton]}
          onPress={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Upload and Get Recipe</Text>
          )}
        </TouchableOpacity>
      </View>

      {file?.assets && file.assets.length > 0 && (
        <View style={styles.imagePreviewContainer}>
          <Text style={styles.imagePreviewTitle}>Selected Image:</Text>
          <Image 
            source={{ uri: file.assets[0].uri }} 
            style={styles.imagePreview}
            resizeMode="contain"
          />
          <Text style={styles.imageName}>{file.assets[0].name}</Text>
        </View>
      )}
      
      {recipe.length > 0 && (
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          {renderTableRows()}
        </View>
      )}
    </ScrollView>
  );
};

export default FoodRecipesPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    marginBottom: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  imagePreviewTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageName: {
    color: '#fff',
    fontSize: 14,
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