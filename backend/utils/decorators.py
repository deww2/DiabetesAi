from functools import wraps
from flask import request, jsonify
import firebase_admin.auth

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token missing or invalid"}), 401

        id_token = auth_header.split(' ')[1]
        try:
            decoded_token = firebase_admin.auth.verify_id_token(id_token)
            # Add user_id to kwargs for use in the route
            kwargs['user_id'] = decoded_token['uid']
            return f(*args, **kwargs)
        except firebase_admin.auth.InvalidIdTokenError:
            return jsonify({"error": "Invalid ID token"}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return decorated_function 