import os
import time
import threading
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
from pathlib import Path

# Constants for file paths
CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config")
CLIENT_SECRETS_PATH = os.path.join(CONFIG_DIR, "client_secrets.json")
CREDENTIALS_PATH = os.path.join(CONFIG_DIR, "mycreds.txt")
IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "images")

class GoogleDriveSync:
    def __init__(self, folder_path=IMAGES_DIR, sync_interval=60, drive_folder_name="BarcoderImages"):
        """
        Initialize Google Drive sync functionality

        Args:
            folder_path: Local folder to sync with Google Drive
            sync_interval: Sync interval in seconds
            drive_folder_name: Name of the folder to use in Google Drive
        """
        self.folder_path = folder_path
        self.sync_interval = sync_interval
        self.drive_folder_name = drive_folder_name
        self.authenticated = False
        self.drive = None
        self.sync_thread = None
        self.stop_sync = False
        # Ensure folder exists
        os.makedirs(folder_path, exist_ok=True)
        # Ensure config directory exists
        os.makedirs(CONFIG_DIR, exist_ok=True)

    def authenticate(self):
        """Authenticate with Google Drive"""
        try:
            gauth = GoogleAuth()
            # Try to load saved client credentials
            gauth.LoadClientConfigFile(CLIENT_SECRETS_PATH)
            gauth.LoadCredentialsFile(CREDENTIALS_PATH)

            if gauth.credentials is None:
                # Authenticate if they're not there
                # Set access_type to offline to get a refresh token
                gauth.GetFlow()
                gauth.flow.params.update({'access_type': 'offline'})
                gauth.flow.params.update({'approval_prompt': 'force'})
                gauth.LocalWebserverAuth()
            elif gauth.access_token_expired:
                # Refresh them if expired
                gauth.Refresh()
            else:
                # Initialize the saved creds
                gauth.Authorize()

            # Save the current credentials to a file
            gauth.SaveCredentialsFile(CREDENTIALS_PATH)
            self.drive = GoogleDrive(gauth)
            self.authenticated = True
            return True
        except Exception as e:
            print(f"Authentication failed: {e}")
            self.authenticated = False
            return False

    def create_drive_folder(self, folder_name=None):
        """Create a folder in Google Drive if it doesn't exist"""
        if folder_name is None:
            folder_name = self.drive_folder_name

        if not self.authenticated:
            if not self.authenticate():
                return None

        # Check if folder already exists
        folder_list = self.drive.ListFile({'q': f"title='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"}).GetList()

        if folder_list:
            return folder_list[0]['id']
        else:
            # Create folder
            folder_metadata = {
                'title': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            folder = self.drive.CreateFile(folder_metadata)
            folder.Upload()
            return folder['id']

    def upload_file(self, file_path, folder_id=None):
        """Upload a file to Google Drive"""
        if not self.authenticated:
            if not self.authenticate():
                return False

        try:
            file_name = os.path.basename(file_path)
            file_metadata = {'title': file_name}

            if folder_id:
                file_metadata['parents'] = [{'id': folder_id}]

            file = self.drive.CreateFile(file_metadata)
            file.SetContentFile(file_path)
            file.Upload()
            return True
        except Exception as e:
            print(f"Failed to upload {file_path}: {e}")
            return False

    def sync_folder(self):
        """Sync the local folder with Google Drive"""
        if not self.authenticated:
            if not self.authenticate():
                return

        folder_id = self.create_drive_folder()
        if not folder_id:
            print("Failed to create or find Google Drive folder")
            return

        # Get list of already uploaded files
        file_list = self.drive.ListFile({'q': f"'{folder_id}' in parents and trashed=false"}).GetList()
        uploaded_files = [file['title'] for file in file_list]

        # Upload new files
        for file_name in os.listdir(self.folder_path):
            if file_name.endswith('.jpg') and file_name not in uploaded_files:
                file_path = os.path.join(self.folder_path, file_name)
                if os.path.isfile(file_path):
                    if self.upload_file(file_path, folder_id):
                        print(f"Uploaded {file_name} to Google Drive")

    def start_sync_thread(self):
        """Start background thread for periodic syncing"""
        if self.sync_thread is not None and self.sync_thread.is_alive():
            return

        self.stop_sync = False
        self.sync_thread = threading.Thread(target=self._sync_worker)
        self.sync_thread.daemon = True
        self.sync_thread.start()

    def _sync_worker(self):
        """Worker thread that syncs at regular intervals"""
        while not self.stop_sync:
            self.sync_folder()
            time.sleep(self.sync_interval)

    def stop_sync_thread(self):
        """Stop the sync thread"""
        self.stop_sync = True
        if self.sync_thread is not None:
            self.sync_thread.join(timeout=1)
