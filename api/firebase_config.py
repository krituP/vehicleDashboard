import os
import json
from google.oauth2 import service_account
import logging

# Add debug logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)



def get_firebase_credentials():
    # Direct path to credentials file for local development
    credentials_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 
        "database",
        "vehicledashboardproject-firebase-adminsdk-qndnw-43f0048e2f.json"
    )
    
    # Log the path being checked
    # logger.debug(f"Looking for credentials at: {credentials_path}")
    # logger.debug(f"File exists: {os.path.exists(credentials_path)}")
    
    if os.path.exists(credentials_path):
        # logger.debug("Found credentials file")
        return credentials_path
        
    # For Vercel deployment
    if os.getenv('FIREBASE_CREDENTIALS'):
        # logger.debug("Using FIREBASE_CREDENTIALS environment variable")
        credentials_dict = json.loads(os.getenv('FIREBASE_CREDENTIALS'))
        return service_account.Credentials.from_service_account_info(credentials_dict)

    raise ValueError(f"Firebase credentials not found at {credentials_path}") 