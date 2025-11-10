import pandas as pd
from firebase_admin import firestore
from config import Config
from utils.logger import setup_logger, log_function_call

# Set up logger
logger = setup_logger('health_service')

class HealthService:
    def __init__(self, db, diabetes_model):
        """Initialize health service with Firestore client"""
        logger.info('Initializing health service')
        self.logger = setup_logger('HealthService')
        self.logger.debug('Initializing HealthService')
        self.db = db
        self.diabetes_model = diabetes_model
        self.activity_level_multipliers = Config.ACTIVITY_LEVEL_MULTIPLIERS
        self.logger.debug('HealthService initialized with diabetes model and activity level multipliers')
        logger.debug('Firestore client configured')

    @log_function_call(logger)
    def calculate_bmi(self, person_info):
        """Calculate BMI and classification"""
        self.logger.debug(f'Calculating BMI for person info: {person_info}')
        
        try:
            weight = int(person_info["weight"])
            height = int(person_info["height"])/100
            bmi = weight / (height ** 2)
            
            if bmi < 18.5:
                bmi_class = "underweight"
            elif bmi < 25:
                bmi_class = "normal weight"
            elif bmi < 30:
                bmi_class = "overweight"
            else:
                bmi_class = "obese"
            
            self.logger.debug(f'BMI calculated: {bmi}, Classification: {bmi_class}')
            return bmi, bmi_class
        except Exception as e:
            self.logger.error(f'Error calculating BMI: {str(e)}')
            raise

    @log_function_call(logger)
    def calculate_energy(self, person_info):
        """Calculate BMR and TDEE"""
        self.logger.debug(f'Calculating energy metrics for person info: {person_info}')
        
        try:
            weight = int(person_info["weight"])
            height = int(person_info["height"])
            age = int(person_info["age"])

            # Calculate BMR using Harris-Benedict equation
            if person_info["sex"] == "Male":
                bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
            else:
                bmr = 447.593 + (9.247 * weight) + (3.100 * height) - (4.330 * age)

            # Calculate TDEE using activity level multiplier
            activity_level = person_info["activity_level"]
            multiplier = self.activity_level_multipliers[activity_level]
            tdee = bmr * multiplier

            self.logger.debug(f'Energy metrics calculated - BMR: {bmr:.2f}, TDEE: {tdee:.2f}')
            return bmr, tdee
        except Exception as e:
            self.logger.error(f'Error calculating energy metrics: {str(e)}')
            raise

    @log_function_call(logger)
    def calculate_macros(self, person_info, calories):
        """Calculate macronutrient breakdown"""
        self.logger.debug(f'Calculating macros for person info: {person_info}, calories: {calories}')
        
        try:
            goal = person_info["goal"].lower()
            if goal == 'lose weight':
                protein_percentage = 30
                fat_percentage = 25
            elif goal == 'maintain':
                protein_percentage = 25
                fat_percentage = 30
            elif goal == 'gain muscle':
                protein_percentage = 35
                fat_percentage = 20
            else:
                raise ValueError("Invalid goal. Use 'lose', 'maintain', or 'gain'.")

            carb_percentage = 100 - (protein_percentage + fat_percentage)
            protein = (protein_percentage / 100) * calories / 4
            fat = (fat_percentage / 100) * calories / 9
            carbs = (carb_percentage / 100) * calories / 4

            macros = {
                'protein': protein,
                'fat': fat,
                'carbs': carbs
            }
            
            self.logger.debug(f'Macros calculated: {macros}')
            return macros
        except Exception as e:
            self.logger.error(f'Error calculating macros: {str(e)}')
            raise

    @log_function_call(logger)
    def check_diabetes_risk(self, user_data):
        """Check diabetes risk using ML model"""
        self.logger.debug(f'Checking diabetes risk for user data: {user_data}')
        
        try:
            # Encode categorical variables
            gender_encoding = {"Female": 0, "Male": 1, "Other": 2}
            smoking_encoding = {"never": 4, "not current": 0, "current": 2, "No Info": 3, "ever": 5, "former": 1}
            location_encoding = dict(zip(Config.LOCATIONS, range(len(Config.LOCATIONS))))

            # Prepare input data
            input_data = {
                "year": [2022],
                "gender": [gender_encoding[user_data['sex']]],
                "age": [user_data['age']],
                "location": [location_encoding[user_data['location']]],
                "africanamerican": [1 if user_data['race'] == "AfricanAmerican" else 0],
                "asian": [1 if user_data['race'] == "Asian" else 0],
                "caucasian": [1 if user_data['race'] == "Caucasian" else 0],
                "hispanic": [1 if user_data['race'] == "Hispanic" else 0],
                "other": [1 if user_data['race'] == "Other" else 0],
                "hypertension": [1 if user_data['hypertension'] == "Yes" else 0],
                "heart_disease": [1 if user_data['heart_disease'] == "Yes" else 0],
                "smoking_history": [smoking_encoding[user_data['smoking_history']]],
                "bmi": [user_data['last_metrics']['bmi']],
                "hbA1c_level": [user_data['hba1c']],
                "blood_glucose_level": [user_data['blood_glucose']],
            }

            self.logger.debug(f'Prepared input data for diabetes prediction: {input_data}')

            # Make prediction
            input_df = pd.DataFrame(input_data)
            prediction = self.diabetes_model.predict(input_df)[0]
            
            result = {
                "prediction": "yes" if int(prediction) == 1 else "no",
                "prediction_code": int(prediction)
            }
            
            self.logger.debug(f'Diabetes risk prediction: {result}')
            return result
        except Exception as e:
            self.logger.error(f'Error checking diabetes risk: {str(e)}')
            raise 