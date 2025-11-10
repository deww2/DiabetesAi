from firebase_admin import auth, firestore
from datetime import datetime
from utils.logger import setup_logger, log_function_call
from google.cloud import firestore

# Set up logger
logger = setup_logger('user_service')

class UserService:
    def __init__(self, db):
        self.logger = setup_logger('UserService')
        self.logger.debug('Initializing UserService')
        self.db = db
        self.logger.debug('UserService initialized with Firestore database')

    @log_function_call(logger)
    def get_user(self, user_id):
        """Get user data from Firestore"""
        self.logger.debug(f'Getting user data for user_id: {user_id}')
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_data = user_ref.get().to_dict()
            
            if not user_data:
                self.logger.warning(f'User not found: {user_id}')
                raise ValueError("User not found")
            
            self.logger.debug(f'User data retrieved successfully: {user_data}')
            return user_data
        except Exception as e:
            self.logger.error(f'Error getting user data: {str(e)}')
            raise


    def create_user(self, user_id, email, display_name=None, **additional_data):
        """Create a new user in Firebase Auth and Firestore"""
        self.logger.debug(f'Creating new user with email: {email}')
        self.logger.debug(f'Additional data: {additional_data}')
        
        try:

            # Create initial user document in Firestore
            user_data = {
                'email': email,
                'display_name': display_name,
                'created_at': firestore.SERVER_TIMESTAMP,
                'last_login': firestore.SERVER_TIMESTAMP,
                **additional_data
            }

            # Save user data to Firestore
            self.db.collection('users').document(user_id).set(user_data)
            self.logger.debug(f'User data saved to Firestore: {user_data}')
            
            return {
                "user_id": user_id,
                "user_data": user_data
            }
        except Exception as e:
            self.logger.error(f'Error creating user: {str(e)}')
            raise

    def create_user_backend(self, email, password, display_name=None, **additional_data):
        """Create a new user in Firebase Auth and Firestore"""
        self.logger.debug(f'Creating new user with email: {email}')
        self.logger.debug(f'Additional data: {additional_data}')
        
        try:
            # Create user in Firebase Auth
            user = auth.create_user(
                email=email,
                password=password,
                display_name=display_name
            )
            self.logger.debug(f'User created in Firebase Auth: {user.uid}')

            # Create initial user document in Firestore
            user_data = {
                'email': email,
                'display_name': display_name,
                'created_at': firestore.SERVER_TIMESTAMP,
                'last_login': firestore.SERVER_TIMESTAMP,
                **additional_data
            }

            # Save user data to Firestore
            self.db.collection('users').document(user.uid).set(user_data)
            self.logger.debug(f'User data saved to Firestore: {user_data}')

            # Create custom token for immediate authentication
            custom_token = auth.create_custom_token(user.uid)
            self.logger.debug('Custom token created for new user')
            
            return {
                "user_id": user.uid,
                "custom_token": custom_token.decode('utf-8'),
                "user_data": user_data
            }
        except Exception as e:
            self.logger.error(f'Error creating user: {str(e)}')
            raise

    @log_function_call(logger)
    def update_user(self, user_id, update_data):
        """Update user data in Firestore"""
        self.logger.debug(f'Updating user data for user_id: {user_id}')
        self.logger.debug(f'Update data: {update_data}')
        
        try:
            user_ref = self.db.collection('users').document(user_id)
            
            # Get existing data
            existing_data = user_ref.get().to_dict()
            if not existing_data:
                self.logger.warning(f'User not found for update: {user_id}')
                raise ValueError("User not found")

            # Merge with existing data
            user_data = {**existing_data, **update_data}
            
            # Update only the provided fields
            update_data = {k: v for k, v in update_data.items() if k in update_data}
            user_ref.update(update_data)
            
            self.logger.debug(f'User data updated successfully. Updated fields: {list(update_data.keys())}')

            return {
                "message": "User data updated successfully",
                "updated_fields": list(update_data.keys())
            }
        except Exception as e:
            self.logger.error(f'Error updating user data: {str(e)}')
            raise

    def login_user(self, email):
        """Handle user login"""
        self.logger.debug(f'Processing login for email: {email}')
        
        try:
            # Get user by email
            user = auth.get_user_by_email(email)
            self.logger.debug(f'User found: {user.uid}')
            
            # Create a custom token
            custom_token = auth.create_custom_token(user.uid)
            self.logger.debug('Custom token created for login')
            
            # Update last login
            self.db.collection('users').document(user.uid).update({
                'last_login': firestore.SERVER_TIMESTAMP
            })
            self.logger.debug('Last login timestamp updated')
            
            return {
                "user_id": user.uid,
                "custom_token": custom_token.decode('utf-8')
            }
        except auth.UserNotFoundError:
            self.logger.warning(f'Login attempt failed - User not found: {email}')
            raise ValueError("User not found")
        except Exception as e:
            self.logger.error(f'Error during login: {str(e)}')
            raise

    @log_function_call(logger)
    def get_chat_history(self, user_id, limit=10):
        """
        Get recent chat history for a user.
        
        Args:
            user_id (str): The ID of the user
            limit (int): Maximum number of messages to retrieve (default: 10)
            
        Returns:
            list: List of chat messages in the format:
                [
                    {
                        "role": "user",
                        "parts": [{ "text": "message" }]
                    },
                    {
                        "role": "model",
                        "parts": [{ "text": "response" }]
                    }
                ]
        """
        try:
            logger.info('Getting chat history', extra={
                'user_id': user_id,
                'limit': limit
            })
            
            # Get all records for the user
            history_docs = (
                self.db.collection('chat_history')
                .where('user_id', '==', user_id)
                .get()
            )

            # Sort the results in memory by timestamp
            history = sorted(
                (doc.to_dict() for doc in history_docs),
                key=lambda x: x.get('timestamp', 0)            )

            messages_only = [h['message'] for h in history]

            logger.info('Chat history retrieved successfully', extra={
                'user_id': user_id,
                'message_count': len(messages_only)
            })
            return messages_only[:limit]
        except Exception as e:
            logger.error('Error getting chat history', extra={
                'user_id': user_id,
                'error': str(e)
            })
            raise e

    @log_function_call(logger)
    def save_chat_message(self, user_id, message, response):
        """
        Save a chat message and its response to the database.
        
        Args:
            user_id (str): The ID of the user
            message (str): The user's message
            response (str): The model's response
        """
        try:
            logger.info('Saving chat message', extra={'user_id': user_id})
            
            # Format messages in the correct structure
            user_message = {
                "role": "user",
                "parts": [{ "text": message }]
            }
            model_message = {
                "role": "model",
                "parts": [{ "text": response }]
            }

            # Save to database
            self.db.collection('chat_history').add({
                'user_id': user_id,
                'message': user_message,
                'timestamp': firestore.SERVER_TIMESTAMP
            })

            self.db.collection('chat_history').add({
                'user_id': user_id,
                'message': model_message,
                'timestamp': firestore.SERVER_TIMESTAMP
            })

            logger.info('Chat message saved successfully', extra={'user_id': user_id})

        except Exception as e:
            logger.error('Error saving chat message', extra={
                'user_id': user_id,
                'message': message,
                'error': str(e)
            })
            raise e
        
    @log_function_call(logger)
    def delete_chat_history(self, user_id):
        """
        Delete all chat history for a user.
        
        Args:
            user_id (str): The ID of the user whose chat history should be deleted
            
        Returns:
            None
        """
        try:
            self.logger.debug(f'Deleting chat history for user_id: {user_id}')
            
            # Get all chat history documents for the user
            history_docs = (
                self.db.collection('chat_history')
                .where('user_id', '==', user_id)
                .get()
            )
            
            # Delete each document in a batch
            batch = self.db.batch()
            for doc in history_docs:
                batch.delete(doc.reference)
            
            # Commit the batch
            batch.commit()
            
            self.logger.debug(f'Successfully deleted chat history for user_id: {user_id}')
            
        except Exception as e:
            self.logger.error(f'Error deleting chat history: {str(e)}')
            raise e

    @log_function_call(logger)
    def verify_token(self, id_token: str) -> dict:
        """Verify Firebase ID token"""
        try:
            logger.info('Verifying Firebase ID token')
            
            # Verify token
            decoded_token = auth.verify_id_token(id_token)
            logger.info('Token verified successfully', extra={'uid': decoded_token['uid']})
            return decoded_token

        except Exception as e:
            logger.error('Error verifying token', extra={'error': str(e)})
            raise 