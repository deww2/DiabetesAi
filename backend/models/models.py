from pydantic import BaseModel

class DietPlan(BaseModel):
    mealtime: str
    foodItem: str
    calories: int
    protein: int
    carbs: int
    fat: int

class Recipe(BaseModel):
    recipeName: str
    calories: int
    protein: int
    fats: int
    carbs: int
    ingredients: str

class MacroBreakdown(BaseModel):
    nutrient: str
    amount: str 

class HealthAdvice(BaseModel):
    general_recommendations: str
    exercise_suggestions: str
    dietary_advice: str
    health_risks: str
    lifestyle_tips: str 

class Message(BaseModel):
    role:str
    content:str