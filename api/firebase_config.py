import os
import json
from google.oauth2 import service_account

def get_firebase_credentials():
    # For local development
    if os.getenv('ENVIRONMENT') == 'development':
        return os.path.join(os.path.dirname(__file__), 'your-credentials-file.json')
    
    # For Vercel deployment
    if os.getenv('FIREBASE_CREDENTIALS'):
        credentials_dict = json.loads(os.getenv('FIREBASE_CREDENTIALS'))
        return service_account.Credentials.from_service_account_info(credentials_dict)
    
    raise ValueError("Firebase credentials not found") 