from flask import Flask
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import joblib
from config import Config
from routes.user_routes import init_user_routes
from routes.health_routes import init_health_routes
from routes.food_routes import init_food_routes
from utils.logger import setup_logger, log_function_call

# Set up logger
logger = setup_logger('app')

@log_function_call(logger)
def create_app():
    """Create and configure the Flask application"""
    logger.info('Initializing Flask application')
    
    # Initialize Flask app
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(Config)
    
    # Validate configuration
    logger.info('Validating configuration')
    Config.validate_config()
    logger.info('Configuration validated successfully')
    
    logger.debug('Flask app initialized with config', extra={'config': str(Config)})

    try:
        # Initialize Firebase
        logger.info('Initializing Firebase')
        cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info('Firebase initialized successfully')

        # Load ML model
        logger.info('Loading ML model')
        diabetes_model = joblib.load(Config.DIABETES_MODEL_PATH)
        logger.info('ML model loaded successfully')

        # Initialize routes
        logger.info('Initializing route blueprints')
        user_bp = init_user_routes(db)
        health_bp = init_health_routes(db, diabetes_model)
        food_bp = init_food_routes(db)
        logger.debug('Route blueprints initialized')

        # Register blueprints
        logger.info('Registering blueprints')
        app.register_blueprint(user_bp, url_prefix='/api/user')
        app.register_blueprint(health_bp, url_prefix='/api/health')
        app.register_blueprint(food_bp, url_prefix='/api/food')
        logger.info('Blueprints registered successfully')

        return app
    except Exception as e:
        logger.error('Error during app initialization', extra={'error': str(e)})
        raise

if __name__ == '__main__':
    try:
        logger.info('Starting application')
        app = create_app()
        logger.info('Application created successfully')
        app.run(host='0.0.0.0', debug=True)
    except Exception as e:
        logger.error('Failed to start application', extra={'error': str(e)})
        raise