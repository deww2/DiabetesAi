from flask import Blueprint, request, jsonify
from services.user_service import UserService
from services.ai_service import AIService
from utils.decorators import require_auth
import requests
from config import Config
from utils.logger import setup_logger, log_api_call, log_function_call
from google.cloud import firestore
from firebase_admin import auth

user_bp = Blueprint('user', __name__)

def init_user_routes(db):
    user_service = UserService(db)
    ai_service = AIService()
    logger = setup_logger('UserRoutes')


    @user_bp.route('/createUser', methods=['POST'])
    @require_auth
    def createUser(user_id):
        try:
            data = request.json
            email = data.get('email')
            display_name = data.get('display_name')
            
            if not email:
                logger.warning('Missing email in signup request')
                return jsonify({"error": "Email and password are required"}), 400
                
            result = user_service.create_user(user_id, email, display_name)
    
            return jsonify({
                "message": "User created successfully",
                "user_id": result["user_id"],
            }), 201
            
        except Exception as e:
            logger.error(f'Error in creating user: {str(e)}')
            return jsonify({"error": str(e)}), 500

    @user_bp.route('/signup', methods=['POST'])
    def signup():
        try:
            data = request.json
            email = data.get('email')
            password = data.get('password')
            display_name = data.get('display_name')
            
            if not email or not password:
                logger.warning('Missing email or password in signup request')
                return jsonify({"error": "Email and password are required"}), 400
                
            result = user_service.create_user(email, password, display_name)
            
            # Exchange custom token for ID token
            url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={Config.FIREBASE_WEB_API_KEY}"
            payload = {
                "token": result["custom_token"],
                "returnSecureToken": True
            }
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                id_token = response.json().get("idToken")
            else:
                logger.error('Failed to exchange custom token for ID token')
                return jsonify({"error": "Failed to exchange token"}), 500
            
            return jsonify({
                "message": "User created successfully",
                "user_id": result["user_id"],
                "custom_token": result["custom_token"],
                "id_token": id_token
            }), 201
            
        except Exception as e:
            logger.error(f'Error in signup: {str(e)}')
            return jsonify({"error": str(e)}), 500

    @user_bp.route('/login', methods=['POST'])
    def login():
        try:
            data = request.json
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                logger.warning('Missing email or password in login request')
                return jsonify({"error": "Email and password are required"}), 400

            result = user_service.login_user(email)
            
            # Exchange custom token for ID token
            url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={Config.FIREBASE_WEB_API_KEY}"
            payload = {
                "token": result["custom_token"],
                "returnSecureToken": True
            }
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                id_token = response.json().get("idToken")
            else:
                logger.error('Failed to exchange custom token for ID token')
                return jsonify({"error": "Failed to exchange token"}), 500
            
            return jsonify({
                "message": "Login successful",
                "user_id": result["user_id"],
                "custom_token": result["custom_token"],
                "id_token": id_token
            }), 200

        except Exception as e:
            logger.error(f'Error in login: {str(e)}')
            return jsonify({"error": str(e)}), 401

    @user_bp.route('/', methods=['GET'])
    @require_auth
    def get_user(user_id):
        try:
            user_data = user_service.get_user(user_id)
            return jsonify(user_data), 200
        except Exception as e:
            logger.error(f'Error getting user data: {str(e)}')
            return jsonify({"error": str(e)}), 404

    @user_bp.route('/', methods=['POST'])
    @require_auth
    def update_user(user_id):
        try:
            update_data = request.json
            if not update_data:
                logger.warning('No update data provided in request')
                return jsonify({"error": "No update data provided"}), 400

            result = user_service.update_user(user_id, update_data)
            return jsonify(result), 200

        except Exception as e:
            logger.error(f'Error updating user: {str(e)}')
            return jsonify({"error": str(e)}), 500

    @user_bp.route('/chat', methods=['POST'])
    @require_auth
    @log_api_call(logger)
    def chat(user_id):
        """
        Chat with the LLM.
        
        Request body:
        {
            "newMessage": "How old are you"
        }
        """
        try:
            data = request.json
            new_message = data.get('newMessage')
            
            if not new_message:
                logger.warning('No message provided in chat request')
                return jsonify({"error": "Message is required"}), 400

            # Process chat message
            logger.debug('Processing chat message', extra={
                'user_id': user_id, 
                'chat_message': new_message
            })

            # Get chat history
            history = user_service.get_chat_history(user_id)
            
            # Get chat response
            response = ai_service.chat(new_message=new_message, history=history)
            
            # Save chat to Firestore
            logger.debug('Saving chat to Firestore', extra={
                'user_id': user_id,
                'response_length': len(response)
            })
            
             # Save chat history using the service
            user_service.save_chat_message(user_id, new_message, response)
            
            logger.info('Chat processed successfully', extra={
                'user_id': user_id,
                'response_length': len(response)
            })
            
            return jsonify({
                "response": response,
                "user_id": user_id
            })

        except Exception as e:
            logger.error('Error in chat', extra={
                'user_id': user_id,
                'error': str(e)
            })
            return jsonify({"error": str(e)}), 500

    @user_bp.route('/chat/history', methods=['GET'])
    @require_auth
    def get_chat_history(user_id):
        """
        Get the chat history for the authenticated user.
        
        Returns:
        {
            "history": [
                {
                    "message": "user message",
                    "response": "ai response",
                    "timestamp": "2024-03-21T10:00:00Z"
                },
                ...
            ]
        }
        """
        try:
            history = user_service.get_chat_history(user_id)
            return jsonify({
                "history": history
            }), 200

        except Exception as e:
            logger.error(f'Error getting chat history: {str(e)}')
            return jsonify({"error": str(e)}), 500

    @user_bp.route('/chat/history', methods=['DELETE'])
    @require_auth
    def delete_chat_history(user_id):
        """
        Delete the chat history for the authenticated user.
        
        Returns:
        {
            "message": "Chat history deleted successfully"
        }
        """
        try:
            user_service.delete_chat_history(user_id)
            return jsonify({
                "message": "Chat history deleted successfully"
            }), 200

        except Exception as e:
            logger.error(f'Error deleting chat history: {str(e)}')
            return jsonify({"error": str(e)}), 500

    @user_bp.route('/profile', methods=['GET'])
    @log_api_call(logger)
    def get_user_profile():
        """Get user profile from Firestore"""
        try:
            # Get user ID from token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                logger.error('Missing or invalid Authorization header')
                return jsonify({'error': 'Unauthorized'}), 401

            token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(token)
            user_id = decoded_token['uid']
            logger.debug('User authenticated', extra={'user_id': user_id})

            # Get user profile from Firestore
            user_ref = db.collection('users').document(user_id)
            user_doc = user_ref.get()

            if not user_doc.exists:
                logger.info('User profile not found', extra={'user_id': user_id})
                return jsonify({'error': 'Profile not found'}), 404

            user_data = user_doc.to_dict()
            logger.info('User profile retrieved successfully', extra={'user_id': user_id})
            return jsonify(user_data)

        except auth.InvalidIdTokenError:
            logger.error('Invalid ID token')
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            logger.error('Error getting user profile', extra={'error': str(e)})
            return jsonify({'error': 'Internal server error'}), 500

    @user_bp.route('/profile', methods=['PUT'])
    @log_api_call(logger)
    def update_user_profile():
        """Update user profile in Firestore"""
        try:
            # Get user ID from token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                logger.error('Missing or invalid Authorization header')
                return jsonify({'error': 'Unauthorized'}), 401

            token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(token)
            user_id = decoded_token['uid']
            logger.debug('User authenticated', extra={'user_id': user_id})

            # Get update data from request
            update_data = request.get_json()
            if not update_data:
                logger.error('No update data provided')
                return jsonify({'error': 'No data provided'}), 400

            logger.debug('Updating user profile', extra={'user_id': user_id, 'update_data': update_data})

            # Update user profile in Firestore
            user_ref = db.collection('users').document(user_id)
            user_ref.update(update_data)

            logger.info('User profile updated successfully', extra={'user_id': user_id})
            return jsonify({'message': 'Profile updated successfully'})

        except auth.InvalidIdTokenError:
            logger.error('Invalid ID token')
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            logger.error('Error updating user profile', extra={'error': str(e)})
            return jsonify({'error': 'Internal server error'}), 500
        
    logger.info('User routes initialized successfully')
    return user_bp 