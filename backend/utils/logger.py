import logging
import sys
import os
import json
from datetime import datetime
from functools import wraps
import traceback
import functools

class CustomFormatter(logging.Formatter):
    """Custom formatter that includes more detailed information"""
    
    def format(self, record):
        # Add timestamp
        record.timestamp = datetime.now().isoformat()
        
        # Add extra fields if they exist
        if hasattr(record, 'extra'):
            record.extra_json = json.dumps(record.extra)
        else:
            record.extra_json = '{}'
            
        # Add stack trace for errors
        if record.levelno >= logging.ERROR:
            record.stack_trace = traceback.format_exc()
        else:
            record.stack_trace = ''
            
        return super().format(record)

def setup_logger(name):
    """Set up a logger with both console and file handlers"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # Create console handler with custom formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_formatter = CustomFormatter(
        '%(timestamp)s - %(name)s - %(levelname)s - %(message)s\n'
        'Extra: %(extra_json)s\n'
        '%(stack_trace)s'
    )
    console_handler.setFormatter(console_formatter)

    # Create the 'logs' directory if it doesn't exist
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Create file handler with custom formatting
    file_handler = logging.FileHandler(
        f'logs/{datetime.now().strftime("%Y-%m-%d")}.log'
    )
    file_handler.setLevel(logging.DEBUG)
    file_formatter = CustomFormatter(
        '%(timestamp)s - %(name)s - %(levelname)s - %(message)s\n'
        'Extra: %(extra_json)s\n'
        '%(stack_trace)s'
    )
    file_handler.setFormatter(file_formatter)

    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

def log_function_call(logger):
    """Decorator to log function calls with arguments and return values"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*func_args, **func_kwargs):
            # Get function name and module
            func_name = func.__name__
            module_name = func.__module__

            # Log function call with arguments
            logger.debug(
                f"Calling {func_name}",
                extra={
                    'function_name': func_name,
                    'module_name': module_name,
                    'function_args': str(func_args),
                    'function_kwargs': str(func_kwargs)
                }
            )

            try:
                # Call the function
                result = func(*func_args, **func_kwargs)

                # Log successful return
                logger.debug(
                    f"Function {func_name} completed successfully",
                    extra={
                        'function_name': func_name,
                        'module_name': module_name,
                        'return_value': str(result)
                    }
                )

                return result

            except Exception as e:
                # Log error with full context
                logger.error(
                    f"Error in {func_name}",
                    extra={
                        'function_name': func_name,
                        'module_name': module_name,
                        'error': str(e),
                        'error_type': type(e).__name__,
                        'traceback': traceback.format_exc()
                    }
                )
                raise

        return wrapper
    return decorator

def log_api_call(logger):
    """Decorator to log API endpoint calls with request and response data"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract request data from Flask request
            from flask import request
            request_data = {
                'method': request.method,
                'url': request.url,
                'headers': dict(request.headers),
                'args': dict(request.args),
                'json': request.get_json(silent=True),
                'form': dict(request.form),
                'files': list(request.files.keys()) if request.files else None
            }
            
            # Log request
            logger.info(
                f"API Request: {request.method} {request.url}",
                extra={'request': request_data}
            )
            
            try:
                # Call the endpoint
                result = func(*args, **kwargs)
                
                # Log response
                logger.info(
                    f"API Response: {request.method} {request.url}",
                    extra={'response': str(result)}
                )
                
                return result
            except Exception as e:
                # Log any exceptions
                logger.error(
                    f"API Error: {request.method} {request.url}",
                    extra={
                        'request': request_data,
                        'error': str(e)
                    }
                )
                raise
                
        return wrapper
    return decorator 