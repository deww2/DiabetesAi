from flask import Blueprint, request, jsonify
from services.ai_service import AIService
from utils.decorators import require_auth
from firebase_admin import firestore, auth
from clarifai.client.model import Model
import os
from datetime import datetime
from config import Config
from utils.logger import setup_logger, log_api_call, log_function_call

food_bp = Blueprint('food', __name__)

def init_food_routes(db):
    """Initialize food routes blueprint"""
    logger = setup_logger('food_routes')
    ai_service = AIService()

    @food_bp.route('/recipes', methods=['POST'])
    @require_auth
    @log_api_call(logger)
    def generate_recipe(user_id):
        """Generate recipe from uploaded image"""
        try:
            # Check if file was uploaded
            if 'file' not in request.files:
                logger.error('No file uploaded')
                return jsonify({'error': 'No file uploaded'}), 400

            file = request.files['file']
            if file.filename == '':
                logger.error('No file selected')
                return jsonify({'error': 'No file selected'}), 400

            logger.debug('File received', extra={
                'user_id': user_id,
                'file_name': file.filename,
                'content_type': file.content_type
            })

            # Save file temporarily
            temp_path = f"temp_{file.filename}"
            file.save(temp_path)
            logger.debug('Saved uploaded file', extra={'temp_path': temp_path})

            try:
                # Run food recognition model
                logger.debug('Initializing Clarifai model')
                model = Model(url=Config.CLARIFAI_MODEL_URL, 
                            pat=Config.CLARIFAI_PAT)
                logger.debug('Running food recognition')
                prediction = model.predict_by_filepath(temp_path, input_type="image")
                
                if prediction.outputs:
                    food_name = prediction.outputs[0].data.concepts[0].name
                    confidence = prediction.outputs[0].data.concepts[0].value
                    logger.debug('Food recognized', extra={
                        'food_name': food_name,
                        'confidence': confidence
                    })
                    
                    # Generate recipe
                    logger.debug('Generating recipe')
                    response = ai_service.generate_recipe(food_name)

                    # Save recipe query
                    logger.debug('Saving recipe query to Firestore')
                    db.collection('recipe_queries').add({
                        'user_id': user_id,
                        'food_name': food_name,
                        'recipe': response,
                        'timestamp': firestore.SERVER_TIMESTAMP
                    })
                    
                    logger.info('Recipe generated successfully', extra={
                        'user_id': user_id,
                        'food_name': food_name
                    })
                    return jsonify({"recipe": response})
                
                logger.warning('No food detected in image', extra={'user_id': user_id})
                return jsonify({"error": "No food detected"}), 400

            finally:
                # Clean up temporary file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    logger.debug('Removed temporary file', extra={'temp_path': temp_path})

        except Exception as e:
            logger.error('Error generating recipe', extra={
                'user_id': user_id,
                'error': str(e)
            })
            return jsonify({'error': 'Internal server error'}), 500

    @food_bp.route('/diet', methods=['POST', 'GET'])
    @require_auth
    @log_api_call(logger)
    def diet(user_id):
        if request.method == 'GET':
            try:
                # Get diet query history for user
                diet_ref = db.collection('diet_queries')
                query = diet_ref.where('user_id', '==', user_id).limit(50)  # Get last 50 diet queries
                diet_queries = query.get()

                if not diet_queries:
                    logger.info('No diet query history found', extra={'user_id': user_id})
                    return jsonify({"error": "No diet query history found"}), 404

                # Sort in memory by timestamp
                sorted_queries = sorted(diet_queries, key=lambda x: x.get('timestamp', 0), reverse=True)
                
                diet_history = []
                for query in sorted_queries:
                    diet_history.append({
                        'food_item': query.get('food_item'),
                        'macro_breakdown': query.get('response'),
                        'timestamp': query.get('timestamp')
                    })

                logger.info('Diet history retrieved successfully', extra={'user_id': user_id})
                return jsonify({
                    "diet_history": diet_history
                })

            except Exception as e:
                logger.error('Error fetching diet history', extra={
                    'user_id': user_id,
                    'error': str(e)
                })
                return jsonify({"error": str(e)}), 500

        try:
            data = request.json
            food_item = data.get('food_item')
            
            if not food_item:
                logger.warning('No food item provided in request', extra={'user_id': user_id})
                return jsonify({"error": "Food item is required"}), 400
            
            logger.debug('Getting macro breakdown', extra={
                'user_id': user_id,
                'food_item': food_item
            })
            response = ai_service.get_macro_breakdown(food_item)
            
            # Save diet query
            logger.debug('Saving diet query to Firestore', extra={'user_id': user_id})
            db.collection('diet_queries').add({
                'user_id': user_id,
                'food_item': food_item,
                'response': response,
                'timestamp': firestore.SERVER_TIMESTAMP
            })
            
            logger.info('Diet query processed successfully', extra={'user_id': user_id})
            return jsonify({
                "food_item": food_item,
                "macro_breakdown": response
            })

        except Exception as e:
            logger.error('Error in diet', extra={
                'user_id': user_id,
                'error': str(e)
            })
            return jsonify({"error": str(e)}), 500

    logger.info('Food routes initialized successfully')
    return food_bp 