from google import genai
from config import Config
from models.models import DietPlan, Recipe, MacroBreakdown, HealthAdvice, Message
from utils.logger import setup_logger, log_function_call

# Set up logger
logger = setup_logger('AIService')

class AIService:
    def __init__(self):
        self.logger = logger
        self.client = genai.Client(api_key=Config.PALM_API_KEY)

    def chat(self, history, new_message):
        """
        Chat with the Gemini model using chat session.
        
        Args:
            history (list): List of previous messages in the format:
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
            new_message (str): The new message to send
            
        Returns:
            str: The model's response
        """
        try:
            print(history)
            # Start a new chat session with history
            chat = self.client.chats.create(model=Config.GEMINI_MODEL,history=history)
            
            # Send the new message
            response = chat.send_message(new_message)
            
            return response.text
        except Exception as e:
            self.logger.error(f'Error in chat: {str(e)}')
            raise e

    def get_response(self, prompt, output_class=None):
        """Get response from Gemini model"""
        self.logger.debug(f'Getting response for prompt: {prompt[:100]}...')
        self.logger.debug(f'Output class: {output_class.__name__ if output_class else "None"}')
        
        try:
            if output_class:
                response = self.client.models.generate_content(
                    model = Config.GEMINI_MODEL,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": list[output_class],
                    },
                )
            else:
                response = self.client.models.generate_content(
                     model = Config.GEMINI_MODEL,
                    contents=prompt
                )
            self.logger.debug(f'Response received: {response.text[:100]}...')
            return response.text
        except Exception as e:
            self.logger.error(f'Error getting response: {str(e)}')
            raise

    @log_function_call(logger)
    def generate_diet_plan(self, user_data, preferences):
        """Generate a diet plan based on user data and preferences"""
        self.logger.debug(f'Generating diet plan for user data: {user_data}')
        self.logger.debug(f'Preferences: {preferences}')
        
        prompt = f"""Create a diabetes-friendly diet plan with the preferences: {preferences} and vegan: {user_data.get('vegan', False)} 
        for a {user_data.get('age')}yo {user_data.get('ethnicity', 'no preference')} {user_data.get('sex')} 
        with a BMI of {user_data.get('bmi')} and goal: {user_data.get('goal')}. 
        TDEE: {user_data.get('tdee'):.0f} cal, BMR: {user_data.get('bmr'):.0f} cal.
        Return a list of DietPlan objects with mealtime, foodItem, calories, protein, carbs, and fat."""
        
        try:
            response = self.get_response(prompt, DietPlan)
            self.logger.debug(f'Diet plan generated successfully')
            return response
        except Exception as e:
            self.logger.error(f'Error generating diet plan: {str(e)}')
            raise

    @log_function_call(logger)
    def generate_health_advice(self, user_data, metrics):
        """Generate health advice based on user data and metrics"""
        self.logger.debug(f'Generating health advice for user data: {user_data}')
        self.logger.debug(f'Metrics: {metrics}')
        
        prompt = f"""
        Provide comprehensive diabetes-friendly health advice for:
        - {user_data['age']} year old {user_data['sex']}
        - Height: {user_data['height']}m, Weight: {user_data['weight']}kg
        - Activity: {user_data['activity_level']}
        - Goal: {user_data['goal']}
        - BMI: {metrics['bmi']} ({metrics['bmi_class']})
        - BMR: {metrics['bmr']}, TDEE: {metrics['tdee']}
        Return a HealthAdvice object with general_recommendations, exercise_suggestions, dietary_advice, health_risks, and lifestyle_tips.
        """
        
        try:
            response = self.get_response(prompt, HealthAdvice)
            self.logger.debug(f'Health advice generated successfully')
            return response
        except Exception as e:
            self.logger.error(f'Error generating health advice: {str(e)}')
            raise

    @log_function_call(logger)
    def generate_recipe(self, food_name):
        """Generate a recipe for a given food item"""
        self.logger.debug(f'Generating recipe for food: {food_name}')
        
        prompt = f"""Generate a diabetes-friendly recipe with {food_name}.
        Return a Recipe object with recipeName, calories, protein, fats, carbs, and ingredients."""
        
        try:
            response = self.get_response(prompt, Recipe)
            self.logger.debug(f'Recipe generated successfully')
            return response
        except Exception as e:
            self.logger.error(f'Error generating recipe: {str(e)}')
            raise

    def get_macro_breakdown(self, food_item):
        """Get macro breakdown for a food item"""
        self.logger.debug(f'Getting macro breakdown for food: {food_item}')
        
        prompt = f"""Return the macro breakdown of {food_item}.
        Return a list of MacroBreakdown objects with nutrient and amount."""
        
        try:
            response = self.get_response(prompt, MacroBreakdown)
            self.logger.debug(f'Macro breakdown generated successfully')
            return response
        except Exception as e:
            self.logger.error(f'Error getting macro breakdown: {str(e)}')
            raise 