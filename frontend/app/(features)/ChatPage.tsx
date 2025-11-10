import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { auth } from '../../firebase';
import { logger } from '../../utils/logger';
import API_URL from '../../backendurl';

interface ChatMessage {
  parts: { text: string }[];
  role: 'user' | 'model';
}

const ChatPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    logger.debug('ChatPage mounted');
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      logger.info('Fetching chat history');
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();
      
      logger.debug('Sending request to fetch chat history');
      const response = await axios.get(`${API_URL}/user/chat/history`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      logger.info('Chat history received', { 
        messageCount: response.data.history.length,
        firstMessage: response.data.history[0]?.parts[0].text?.substring(0, 50) + '...'
      });
      
      setMessages(response.data.history);
    } catch (error: any) {
      logger.error('Error fetching chat history', {
        errorMessage: error.message,
        responseData: error.response?.data,
        statusCode: error.response?.status
      });
      Alert.alert('Error', error.response?.data?.error || 'Failed to fetch chat history');
    } finally {
      setLoading(false);
      logger.debug('Chat history fetch completed');
    }
  };


  const handleSendMessage = async () => {
    if (!input.trim()) {
      logger.warn('Attempted to send empty message');
      return;
    }

    try {
      logger.info('Sending new message', { messageLength: input.length });
      setSending(true);
      const user = auth.currentUser;
      if (!user) {
        logger.error('No authenticated user found');
        throw new Error('No user signed in.');
      }

      logger.debug('Getting ID token for user', { uid: user.uid });
      const idToken = await user.getIdToken();

      const newMessage: ChatMessage = {
        role: 'user' as const,
        parts: [{ text: input }],
      };

      logger.debug('Sending message to server');
      const response = await axios.post(
        `${API_URL}/user/chat`,
        { newMessage: input },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      logger.info('Server response received', {
        status: response.status,
        hasResponse: !!response.data.response
      });

      const assistantMessage: ChatMessage = {
        role: 'model' as const,
        parts: [{ text: response.data.response }],
      };

      setMessages((prev) => [...prev, newMessage, assistantMessage]);
      setInput('');
      logger.debug('Message exchange completed successfully');
    } catch (error: any) {
      logger.error('Error sending message', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
      logger.debug('Message send process completed');
    }
  };

  const handleDeleteHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user signed in.');
      }

      const idToken = await user.getIdToken();
      await axios.delete(`{API_URL}/user/chat/history`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      setMessages([]);
      Alert.alert('Success', 'Chat history deleted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to delete chat history');
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    return (
      <View 
        key={index} 
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.botMessage
        ]}
      >
        <Text style={styles.messageText}>{message.parts[0].text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteHistory}
        >
          <Text style={styles.deleteButtonText}>Delete History</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading chat history...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(renderMessage)}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type your message"
          placeholderTextColor="#999"
          style={styles.input}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, sending && styles.sendingButton]}
          onPress={handleSendMessage}
          disabled={sending || !input.trim()}
        >
          <Text style={styles.sendButtonText}>
            {sending ? 'Sending...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1e1e1e',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    color: '#fff',
    backgroundColor: '#333',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  sendingButton: {
    backgroundColor: '#2E7D32',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
