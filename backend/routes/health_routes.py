from flask import Blueprint, request, jsonify
from services.health_service import HealthService
from services.ai_service import AIService
from services.user_service import UserService
from utils.decorators import require_auth
from firebase_admin import firestore, auth
from utils.logger import setup_logger, log_api_call, log_function_call

# Set up logger
logger = setup_logger('health_routes')

health_bp = Blueprint('health', __name__)

def init_health_routes(db, diabetes_model):
    health_service = HealthService(db, diabetes_model)
    user_service = UserService(db)
    ai_service = AIService()

    @health_bp.route('/plan', methods=['POST', 'GET'])
    @require_auth
    def plan(user_id):
        if request.method == 'GET':
            try:
                # Get latest plan for user
                plans_ref = db.collection('plans')
                query = plans_ref.where('user_id', '==', user_id).limit(10)  # Get last 10 plans
                plans = query.get()

                if not plans:
                    return jsonify({"error": "No plan found"}), 404

                # Sort in memory by created_at
                sorted_plans = sorted(plans, key=lambda x: x.to_dict().get('created_at', 0), reverse=True)
                plan_doc = sorted_plans[0]
                
                return jsonify({
                    "plan": plan_doc.to_dict().get('plan'),
                    "plan_id": plan_doc.id,
                    "created_at": plan_doc.to_dict().get('created_at')
                })

            except Exception as e:
                return jsonify({"error": str(e)}), 500

        try:
            # Get user data
            user_data = user_service.get_user(user_id)
            
            # Get preferences from request
            data = request.json
            preferences = data.get('preferences', 'no specific preferences')

            # Calculate metrics
            bmi, _ = health_service.calculate_bmi(user_data)
            bmr, tdee = health_service.calculate_energy(user_data)

            # Add metrics to user data
            user_data.update({
                'bmi': bmi,
                'bmr': bmr,
                'tdee': tdee
            })

            # Generate diet plan
            plan_json = ai_service.generate_diet_plan(user_data, preferences)
            
            # Save to user's plan history
            plan_ref = db.collection('plans').document()
            plan_ref.set({
                'user_id': user_id,
                'plan': plan_json,
                'created_at': firestore.SERVER_TIMESTAMP
            })

            return jsonify({
                "plan": plan_json,
                "plan_id": plan_ref.id
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @health_bp.route('/advice', methods=['POST', 'GET'])
    @require_auth
    @log_api_call(logger)
    def life_advice(user_id):
        if request.method == 'GET':
            try:
                # Get latest advice for user
                advice_ref = db.collection('advice')
                query = advice_ref.where('user_id', '==', user_id).limit(10)  # Get last 10 advice entries
                advice_docs = query.get()

                if not advice_docs:
                    return jsonify({"error": "No advice found"}), 404

                # Sort in memory by timestamp
                sorted_advice = sorted(advice_docs, key=lambda x: x.to_dict().get('timestamp', 0), reverse=True)
                advice_doc = sorted_advice[0]
                
                return jsonify({
                    "advice": advice_doc.get('advice'),
                    "metrics": advice_doc.get('metrics'),
                    "timestamp": advice_doc.get('timestamp')
                })

            except Exception as e:
                return jsonify({"error": str(e)}), 500

        try:
            # Get user data
            user_data = user_service.get_user(user_id)
            
            # Calculate metrics
            bmi, bmi_class = health_service.calculate_bmi(user_data)
            bmr, tdee = health_service.calculate_energy(user_data)
            
            metrics = {
                'bmi': bmi,
                'bmi_class': bmi_class,
                'bmr': bmr,
                'tdee': tdee
            }
            
            # Generate health advice
            advice = ai_service.generate_health_advice(user_data, metrics)
            
            # Save advice
            db.collection('advice').add({
                'user_id': user_id,
                'advice': advice,
                'metrics': metrics,
                'timestamp': firestore.SERVER_TIMESTAMP
            })
            
            return jsonify({
                "advice": advice,
                "metrics": metrics
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @health_bp.route('/diabetes_check', methods=['POST', 'GET'])
    @require_auth
    @log_api_call(logger)
    def diabetes_check(user_id):
        if request.method == 'GET':
            try:
                # Get latest diabetes check for user
                checks_ref = db.collection('diabetes_checks')
                query = checks_ref.where('user_id', '==', user_id).limit(10)  # Get last 10 checks
                checks = query.get()

                if not checks:
                    return jsonify({"error": "No diabetes check found"}), 404

                # Sort in memory by timestamp
                sorted_checks = sorted(checks, key=lambda x: x.get('timestamp', 0), reverse=True)
                check_doc = sorted_checks[0]
                
                return jsonify({
                    "prediction": check_doc.get('prediction'),
                    "prediction_code": check_doc.get('prediction_code'),
                    "timestamp": check_doc.get('timestamp')
                })

            except Exception as e:
                return jsonify({"error": str(e)}), 500

        try:
            # Get user data
            user_data = user_service.get_user(user_id)
            
            # Check diabetes risk
            result = health_service.check_diabetes_risk(user_data)
            
            # Save check result
            db.collection('diabetes_checks').add({
                'user_id': user_id,
                'prediction': result["prediction"],
                'prediction_code': result["prediction_code"],
                'timestamp': firestore.SERVER_TIMESTAMP
            })
            
            return jsonify({
                "prediction": result["prediction"],
                "prediction_code": result["prediction_code"],
                "user_id": user_id
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @health_bp.route('/calculate_metrics', methods=['POST', 'GET'])
    @require_auth
    @log_api_call(logger)
    def calculate_metrics(user_id):
        if request.method == 'GET':
            try:
                # Get latest metrics from user document
                user_data = user_service.get_user(user_id)
                last_metrics = user_data.get('last_metrics')

                if not last_metrics:
                    return jsonify({"error": "No metrics found"}), 404

                return jsonify(last_metrics)

            except Exception as e:
                return jsonify({"error": str(e)}), 500

        try:
            # Get user data
            user_data = user_service.get_user(user_id)
            
            # Calculate metrics
            bmi, bmi_class = health_service.calculate_bmi(user_data)
            bmr, tdee = health_service.calculate_energy(user_data)
            macros = health_service.calculate_macros(user_data, tdee)

            # Save metrics to user document
            db.collection('users').document(user_id).update({
                'last_metrics': {
                    'bmi': bmi,
                    'bmi_class': bmi_class,
                    'bmr': bmr,
                    'tdee': tdee,
                    'macros': macros,
                    'calculated_at': firestore.SERVER_TIMESTAMP
                }
            })

            return jsonify({
                "user_id": user_id,
                "bmi": bmi,
                "bmi_class": bmi_class,
                "bmr": bmr,
                "tdee": tdee,
                "macros": macros
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500



    logger.info('Health routes initialized successfully')
    return health_bp 