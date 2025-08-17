from http.server import BaseHTTPRequestHandler
import json
import internetarchive
import os
import requests
import urllib3
import tempfile
import time

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get request data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Extract data from your existing script format
            file_url = data['fileUrl']  # URL to the uploaded file
            videoid = data['videoid']
            title = data['title']
            description = data.get('description', '')
            callback_url = data['callbackUrl']
            
            # Download file from blob URL to temporary location
            print(f"📥 Downloading file from: {file_url}")
            response = requests.get(file_url, stream=True)
            response.raise_for_status()
            
            # Create temporary file with proper name
            with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp_file:
                for chunk in response.iter_content(chunk_size=8192):
                    tmp_file.write(chunk)
                filepath = tmp_file.name
            
            print(f"📊 File downloaded to: {filepath}")
            
            # Use your existing upload logic
            IA_IDENTIFIER = f"lessonvideo_{videoid}"
            
            # Check if file exists (from your script)
            if not os.path.exists(filepath):
                print(f"❌ CRITICAL ERROR: File not found at {filepath}")
                requests.post(callback_url, json={"uploadStatus": "FAILED"})
                self.send_error_response("File not found")
                return
            
            # File size check (from your script)
            file_size = os.path.getsize(filepath)
            print(f"📊 Starting upload: {file_size / 1024 / 1024:.2f} MB")
            
            # Update status to uploading (from your script)
            requests.post(callback_url, json={"uploadStatus": "UPLOADING"})
            
            # Prepare upload files (from your script)
            upload_files = {os.path.basename(filepath): filepath}
            
            # Enhanced retry logic (from your script)
            max_attempts = 5
            attempt = 1
            upload_successful = False
            
            while attempt <= max_attempts and not upload_successful:
                try:
                    print(f"🔄 Upload attempt {attempt}/{max_attempts}")
                    
                    up = internetarchive.upload(
                        IA_IDENTIFIER,
                        upload_files,
                        metadata={
                            'title': title,
                            'description': description,
                            'mediatype': 'movies',
                            'subject': 'lesson, education',
                            'creator': 'My Smart Digital School',
                            'language': 'eng'
                        },
                        retries=3,
                        retries_sleep=60,
                        verbose=True,  # Keep this for upload percentage
                        request_kwargs={
                            'timeout': 3600,
                        }
                    )
                    
                    print(f"✅ Upload successful on attempt {attempt}!")
                    upload_successful = True
                    break
                    
                except (requests.exceptions.ConnectionError, 
                        urllib3.exceptions.ProtocolError,
                        requests.exceptions.ReadTimeout,
                        requests.exceptions.Timeout) as e:
                    
                    print(f"❌ Attempt {attempt} failed: connection error")
                    
                    if attempt < max_attempts:
                        wait_time = attempt * 15
                        print(f"⏳ Waiting {wait_time} seconds before retry...")
                        time.sleep(wait_time)
                        attempt += 1
                    else:
                        print(f"💥 All {max_attempts} attempts failed")
                        raise e
                
                except internetarchive.exceptions.AuthenticationError as auth_error:
                    print(f"🔐 AUTHENTICATION ERROR: {auth_error}")
                    print(f"💡 Run 'ia configure' to set up credentials")
                    raise auth_error
                
                except Exception as unexpected_error:
                    print(f"💥 Unexpected error on attempt {attempt}: {type(unexpected_error).__name__}")
                    
                    if attempt < max_attempts:
                        wait_time = 60
                        print(f"⏳ Waiting {wait_time} seconds before retry...")
                        time.sleep(wait_time)
                        attempt += 1
                    else:
                        raise unexpected_error
            
            # Check upload results (from your script)
            if upload_successful and up and len(up) > 0:
                first_response = up[0]
                
                if first_response.status_code in (200, 201):
                    archive_url = f"https://archive.org/details/{IA_IDENTIFIER}"
                    files_url = f"https://archive.org/download/{IA_IDENTIFIER}/{os.path.basename(filepath)}"
                    
                    print(f"🎉 UPLOAD SUCCESSFUL!")
                    print(f"🔗 Archive URL: {archive_url}")
                    
                    # Update status via callback (from your script)
                    requests.post(callback_url, json={
                        "archiveIdentifier": IA_IDENTIFIER,
                        "archiveUrl": archive_url,
                        "directVideoUrl": files_url,
                        "uploadStatus": "COMPLETED",
                    })
                    
                    response_data = {"success": True, "message": "Upload completed"}
                else:
                    print(f"❌ Upload failed with HTTP {first_response.status_code}")
                    requests.post(callback_url, json={"uploadStatus": "FAILED"})
                    response_data = {"success": False, "error": f"Upload failed with HTTP {first_response.status_code}"}
            else:
                print(f"❌ Upload failed - no response")
                requests.post(callback_url, json={"uploadStatus": "FAILED"})
                response_data = {"success": False, "error": "Upload failed - no response"}
            
            # Clean up temporary file (from your script)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                    print(f"🧹 Cleaned up temp file: {filepath}")
                except Exception as cleanup_error:
                    print(f"❌ Cleanup failed: {cleanup_error}")
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except ImportError as e:
            print(f"📦 IMPORT ERROR: {e}")
            print(f"💡 Install missing modules: pip install internetarchive requests")
            if 'callback_url' in locals():
                requests.post(callback_url, json={"uploadStatus": "FAILED"})
            self.send_error_response(f"Import error: {e}")
            
        except internetarchive.exceptions.AuthenticationError as e:
            print(f"🔐 AUTHENTICATION ERROR: {e}")
            if 'callback_url' in locals():
                requests.post(callback_url, json={"uploadStatus": "FAILED"})
            self.send_error_response(f"Authentication error: {e}")
            
        except Exception as e:
            print(f"💥 FINAL ERROR: {type(e).__name__}")
            print(f"Error details: {str(e)}")
            
            # Clean up temp file if it exists
            if 'filepath' in locals() and os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except:
                    pass
            
            # Update status as failed
            if 'callback_url' in locals():
                requests.post(callback_url, json={"uploadStatus": "FAILED"})
            
            self.send_error_response(f"Upload error: {str(e)}")
    
    def send_error_response(self, error_message):
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"error": error_message}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
