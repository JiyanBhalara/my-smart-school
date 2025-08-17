import argparse, os, sys, time
import internetarchive
import requests
import urllib3

def update_status(vid, fields):
    # Use NEXTAUTH_URL environment variable with fallback
    base_url = os.environ.get('NEXTAUTH_URL', 'http://localhost:3000')
    # Remove trailing slash if present to avoid double slashes in URL
    base_url = base_url.rstrip('/')
    apiurl = f"{base_url}/api/video/{vid}/status"
    try:
        response = requests.post(apiurl, json=fields, timeout=30)
        if response.status_code == 200:
            print(f"✅ Status updated successfully")
        else:
            print(f"❌ Failed to update status: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Failed to update status: {e}")

def main():
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument('--filepath', required=True)
        parser.add_argument('--videoid', required=True)
        parser.add_argument('--title', required=True)
        parser.add_argument('--description', default='')
        args = parser.parse_args()

        # Remove quotes from arguments
        filepath = args.filepath.strip('"')
        title = args.title.strip('"')
        description = args.description.strip('"')
        
        IA_IDENTIFIER = f"lessonvideo_{args.videoid}"
        
        # Check if file exists
        if not os.path.exists(filepath):
            print(f"❌ CRITICAL ERROR: File not found at {filepath}")
            update_status(args.videoid, {"uploadStatus": "FAILED"})
            return

        # File size check
        file_size = os.path.getsize(filepath)
        print(f"📊 Starting upload: {file_size / 1024 / 1024:.2f} MB")
        
        # Update status to uploading
        update_status(args.videoid, {"uploadStatus": "UPLOADING"})
        
        # Prepare upload files
        upload_files = {os.path.basename(filepath): filepath}
        
        # Enhanced retry logic
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

        # Check upload results
        if upload_successful and up and len(up) > 0:
            first_response = up[0]
            
            if first_response.status_code in (200, 201):
                archive_url = f"https://archive.org/details/{IA_IDENTIFIER}"
                files_url = f"https://archive.org/download/{IA_IDENTIFIER}/{os.path.basename(filepath)}"
                
                print(f"🎉 UPLOAD SUCCESSFUL!")
                print(f"🔗 Archive URL: {archive_url}")
                
                update_status(args.videoid, {
                    "archiveIdentifier": IA_IDENTIFIER,
                    "archiveUrl": archive_url,
                    "directVideoUrl": files_url,
                    "uploadStatus": "COMPLETED",
                })
            else:
                print(f"❌ Upload failed with HTTP {first_response.status_code}")
                update_status(args.videoid, {"uploadStatus": "FAILED"})
        else:
            print(f"❌ Upload failed - no response")
            update_status(args.videoid, {"uploadStatus": "FAILED"})
            
    except ImportError as e:
        print(f"📦 IMPORT ERROR: {e}")
        print(f"💡 Install missing modules: pip install internetarchive requests")
        if 'args' in locals():
            update_status(args.videoid, {"uploadStatus": "FAILED"})
    except internetarchive.exceptions.AuthenticationError as e:
        print(f"🔐 AUTHENTICATION ERROR: {e}")
        if 'args' in locals():
            update_status(args.videoid, {"uploadStatus": "FAILED"})
    except Exception as e:
        print(f"💥 FINAL ERROR: {type(e).__name__}")
        if 'args' in locals():
            update_status(args.videoid, {"uploadStatus": "FAILED"})
    
    finally:
        # Clean up temporary file
        if 'filepath' in locals() and os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as cleanup_error:
                print(f"❌ Cleanup failed: {cleanup_error}")
        
        # Force exit with fallback
        try:
            os._exit(0)
        except:
            sys.exit(0)

if __name__ == "__main__":
    main()
