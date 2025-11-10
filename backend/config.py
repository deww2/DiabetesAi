import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'

    # Firebase settings
    FIREBASE_CREDENTIALS_PATH = os.environ.get('FIREBASE_CREDENTIALS_PATH', 'firebase-creds.json')
    FIREBASE_WEB_API_KEY = os.environ.get('FIREBASE_WEB_API_KEY')

    # AI settings
    PALM_API_KEY = os.environ.get('PALM_API_KEY')
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.0-flash')

    # ML model settings
    DIABETES_MODEL_PATH = os.environ.get('DIABETES_MODEL_PATH', 'random_forest_model.pkl')

    # Clarifai settings
    CLARIFAI_MODEL_URL = os.environ.get('CLARIFAI_MODEL_URL', 'https://clarifai.com/clarifai/main/models/food-item-recognition')
    CLARIFAI_PAT = os.environ.get('CLARIFAI_PAT')

    # Activity level multipliers for TDEE calculation
    ACTIVITY_LEVEL_MULTIPLIERS = {
        "Sedentary": 1.2,
        "Lightly Active": 1.375,
        "Moderately Active": 1.55,
        "Very Active": 1.725,
        "Extra Active": 1.9,
    }

    # Valid locations for diabetes check
    LOCATIONS = [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
        'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia',
        'Guam', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
        'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
        'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
        'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina',
        'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Puerto Rico',
        'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
        'United States', 'Utah', 'Vermont', 'Virgin Islands', 'Virginia',
        'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
    ]

    # Valid races for diabetes check
    RACES = ["AfricanAmerican", "Asian", "Caucasian", "Hispanic", "Other"]

    # Valid smoking history values
    SMOKING_HISTORY = ["never", "not current", "current", "No Info", "ever", "former"]

    @classmethod
    def validate_config(cls):
        """Validate that all required environment variables are set."""
        required_vars = [
            'FIREBASE_WEB_API_KEY',
            'PALM_API_KEY',
            'CLARIFAI_PAT'
        ]
        
        missing_vars = [var for var in required_vars if not getattr(cls, var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}") 