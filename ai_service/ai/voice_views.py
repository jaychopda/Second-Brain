import os
import json
import re
import requests
import shutil
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import datetime

# Try to import Sarvam config
try:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from sarvam_config import (
        SARVAM_API_KEY,
    )
    print("Sarvam AI configuration loaded successfully")
except ImportError:
    print("Warning: Sarvam AI configuration not found. Using default values.")
    SARVAM_API_KEY = os.getenv('SARVAM_API_KEY', '')

# Sarvam AI API configuration
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

# Try to import optional dependencies
try:
    print("Trying to import google.generativeai")
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
    # Configure Gemini AI
    genai.configure(api_key="AIzaSyAPCxYBsWvU1wvywinEmRHa6Vx1EF8Z3rE")
    model = genai.GenerativeModel("gemini-1.5-flash")
    print("Gemini AI configured successfully")
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: Gemini AI not available. Will use fallback intent analysis.")

def is_english_text(text):
    """
    Check if text contains mostly English characters
    """
    if not text:
        return False
    
    # Count English characters (basic Latin alphabet, numbers, common punctuation)
    english_chars = sum(1 for char in text if ord(char) < 128)
    total_chars = len(text)
    
    # If more than 90% are English characters, consider it English
    english_ratio = english_chars / total_chars if total_chars > 0 else 0
    
    # Log the detection details for debugging
    non_english_chars = [char for char in text if ord(char) >= 128]
    if non_english_chars:
        print(f"Non-English characters detected: {non_english_chars}")
        print(f"English ratio: {english_ratio:.2f} ({english_chars}/{total_chars})")
    
    return english_ratio > 0.9

def transcribe_audio_with_sarvam(audio_file_path):
    """
    Transcribe audio using direct HTTP requests to Sarvam AI API
    """
    try:
        if not SARVAM_API_KEY:
            print("Warning: Sarvam API key not configured")
            return None

        print(f"Transcribing audio with Sarvam AI: {audio_file_path}")

        # Prepare multipart/form-data
        with open(audio_file_path, "rb") as f:
            files = {
                "file": (os.path.basename(audio_file_path), f, "audio/webm")
            }
            data = {
                "model": "saarika:v2.5",     # Recommended model
                "language_code": "en-IN",    # Force English transcription
            }
            headers = {
                "api-subscription-key": SARVAM_API_KEY
            }

            # Send to Sarvam STT API
            response = requests.post(
                SARVAM_STT_URL,
                headers=headers,
                data=data,
                files=files,
                timeout=60
            )

        print(f"Sarvam AI response status: {response.status_code}")
        print(f"Sarvam AI response: {response.text[:300]}")

        # Handle response
        if response.status_code == 200:
            result = response.json()
            transcribed_text = result.get("transcript") or result.get("text")
            
            if transcribed_text:
                # Check if the transcribed text is in English
                if is_english_text(transcribed_text):
                    print(f"Sarvam AI transcription successful (English): {transcribed_text}")
                    return transcribed_text
                else:
                    print(f"Sarvam AI transcription returned non-English text: {transcribed_text}")
                    print("Rejecting non-English transcription - please speak in English")
                    return None
            else:
                print("Sarvam AI transcription returned empty result")
                return None
        else:
            print(f"Sarvam AI transcription failed with status {response.status_code}")
            return None

    except Exception as e:
        print(f"Error with Sarvam AI transcription: {e}")
        return None

def analyze_intent(text):
    """
    Use Gemini AI to analyze user intent from transcribed text
    """
    if not GEMINI_AVAILABLE:
        return fallback_intent_analysis(text)
    
    prompt = f"""
    Analyze the following user input and determine what action they want to perform.
    Return a JSON response with the following structure:
    {{
        "action": "add_content|search|embedding_search",
        "data": {{
            "query": "the search query if applicable",
            "searchType": "normal|secondbrain",
            "content": {{
                "title": "extracted title if applicable",
                "link": "extracted link if applicable",
                "description": "extracted description if applicable",
                "type": "note|link|image|audio|video|document",
                "tags": ["extracted", "tags", "if", "any"]
            }}
        }}
    }}

    User input: "{text}"

    Examples:
    - "Add a note about machine learning" -> {{"action": "add_content", "data": {{"content": {{"title": "Machine Learning", "description": "Note about machine learning", "type": "note", "tags": ["machine learning", "AI"]}}}}}}
    - "Search for Python tutorials" -> {{"action": "search", "data": {{"query": "Python tutorials", "searchType": "normal"}}}}
    - "Find similar content about AI" -> {{"action": "embedding_search", "data": {{"query": "AI", "searchType": "secondbrain"}}}}
    - "Save this link about React" -> {{"action": "add_content", "data": {{"content": {{"title": "React", "description": "","link": "https://react.dev", "type": "link", "tags": ["React", "frontend"]}}}}}}
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return result
        else:
            # Fallback to simple keyword matching
            return fallback_intent_analysis(text)
            
    except Exception as e:
        print(f"Error analyzing intent with Gemini: {e}")
        return fallback_intent_analysis(text)

def fallback_intent_analysis(text):
    """
    Fallback intent analysis using simple keyword matching
    """
    text_lower = text.lower()
    
    # Check for add content intent
    add_keywords = ['add', 'create', 'save', 'store', 'note', 'link', 'image', 'audio', 'video', 'document']
    if any(keyword in text_lower for keyword in add_keywords):
        return {
            "action": "add_content",
            "data": {
                "content": {
                    "title": extract_title(text),
                    "description": text,
                    "type": determine_content_type(text),
                    "tags": extract_tags(text)
                }
            }
        }
    
    # Check for search intent
    search_keywords = ['search', 'find', 'look for', 'show me', 'get']
    if any(keyword in text_lower for keyword in search_keywords):
        return {
            "action": "search",
            "data": {
                "query": text,
                "searchType": "normal"
            }
        }
    
    # Check for embedding search intent
    embedding_keywords = ['similar', 'related', 'semantic', 'meaning', 'context']
    if any(keyword in text_lower for keyword in embedding_keywords):
        return {
            "action": "embedding_search",
            "data": {
                "query": text,
                "searchType": "secondbrain"
            }
        }
    
    # Default to add content
    return {
        "action": "add_content",
        "data": {
            "content": {
                "title": extract_title(text),
                "description": text,
                "type": "note",
                "tags": extract_tags(text)
            }
        }
    }

def extract_title(text):
    """Extract a title from the text"""
    words = text.split()
    if len(words) <= 5:
        return text
    return ' '.join(words[:5]) + '...'

def determine_content_type(text):
    """Determine content type based on keywords"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['link', 'url', 'website', 'http']):
        return 'url'
    elif any(word in text_lower for word in ['image', 'photo', 'picture']):
        return 'image'
    elif any(word in text_lower for word in ['audio', 'sound', 'music', 'recording']):
        return 'audio'
    elif any(word in text_lower for word in ['video', 'movie', 'clip']):
        return 'youtube'
    elif any(word in text_lower for word in ['document', 'file', 'pdf']):
        return 'text'
    else:
        return 'text'

def extract_tags(text):
    """Extract potential tags from text"""
    words = text.split()
    tags = []
    
    for word in words:
        word_clean = re.sub(r'[^\w]', '', word.lower())
        if len(word_clean) > 2 and word_clean not in ['the', 'and', 'for', 'with', 'this', 'that']:
            tags.append(word_clean)
    
    return tags[:5]  # Limit to 5 tags

def create_content_in_backend(content_data, user_token):
    """
    Create content in the main backend via API call
    """
    try:
        # Map the content type to backend expected type
        content_type = content_data.get('type', 'text')
        if content_type == 'note':
            content_type = 'text'

        if content_type == 'link':
            content_type = 'url'
            content = content_data.get('link', '')
        else:
            content = content_data.get('description', '')
        
        # Prepare the payload for the backend
        payload = {
            'title': content_data.get('title', 'Voice Note'),
            'description': content_data.get('description', ''),
            'type': content_type,
            'link': content,
            'tags': content_data.get('tags', [])
        }
        
        # Make API call to the main backend
        backend_url = 'http://127.0.0.1:3000/api/v1/content'
        headers = {
            'Content-Type': 'application/json',
            'token': user_token
        }
        
        print(f"Creating content in backend: {payload}")
        response = requests.post(backend_url, json=payload, headers=headers)
        
        if response.status_code == 201:
            result = response.json()
            print(f"Content created successfully: {result}")
            return {
                'success': True,
                'message': 'Content created successfully',
                'content': result.get('content', {})
            }
        else:
            print(f"Backend error: {response.status_code} - {response.text}")
            return {
                'success': False,
                'message': f'Backend error: {response.status_code}',
                'error': response.text
            }
            
    except Exception as e:
        print(f"Error creating content in backend: {e}")
        return {
            'success': False,
            'message': f'Error creating content: {str(e)}',
            'error': str(e)
        }

@api_view(['POST'])
def process_voice(request):
    """
    Process voice input: receive audio and transcribe using Sarvam AI
    """
    print("Processing voice input")
    try:
        if 'audio' not in request.FILES:
            return Response(
                {'error': 'No audio file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        audio_file = request.FILES['audio']
        print(f"Audio file received: {audio_file.name}, size: {audio_file.size} bytes")
        
        # Save audio file temporarily
        temp_path = default_storage.save(
            f'temp_audio_{audio_file.name}', 
            ContentFile(audio_file.read())
        )
        temp_full_path = os.path.join(settings.MEDIA_ROOT, temp_path)
        
        try:
            # Attempt transcription with Sarvam AI
            transcribed_text = transcribe_audio_with_sarvam(temp_full_path)
            
            # Clean up temporary file
            default_storage.delete(temp_path)
            
            if transcribed_text:
                # Successfully transcribed, analyze intent
                intent_result = analyze_intent(transcribed_text)
                
                # If it's an add_content action, create the content
                if intent_result['action'] == 'add_content':
                    # Return the transcribed text for user to edit if needed
                    return Response({
                        'success': True,
                        'transcribed_text': transcribed_text,
                        'action': 'transcription_success',
                        'data': {
                            'transcribed_text': transcribed_text,
                            'intent': intent_result,
                            'requires_confirmation': True
                        }
                    })
                else:
                    # For other actions, return the intent analysis
                    return Response({
                        'success': True,
                        'transcribed_text': transcribed_text,
                        'action': intent_result['action'],
                        'data': intent_result['data']
                    })
            else:
                # Transcription failed, fallback to manual input
                return Response({
                    'success': False,
                    'transcribed_text': '',
                    'action': 'user_input_required',
                    'data': {
                        'message': 'Speech-to-text failed. Please type your command.',
                        'requires_user_input': True
                    },
                    'note': 'Sarvam AI transcription failed'
                })
            
        except Exception as e:
            # Clean up on error
            if default_storage.exists(temp_path):
                default_storage.delete(temp_path)
            raise e
            
    except Exception as e:
        print(f"Error processing voice: {e}")
        return Response(
            {'error': f'Error processing voice input: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def transcribe_audio(request):
    """
    Transcribe audio file using Sarvam AI and return text
    """
    print("Transcribe audio endpoint called")
    print(f"Request method: {request.method}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Request FILES keys: {list(request.FILES.keys()) if request.FILES else 'No files'}")
    
    try:
        if 'audio' not in request.FILES:
            print("No audio file in request.FILES")
            return Response(
                {'error': 'No audio file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        audio_file = request.FILES['audio']
        print(f"Audio file received for transcription: {audio_file.name}, size: {audio_file.size} bytes")
        
        # Save audio file temporarily
        temp_path = default_storage.save(
            f'temp_transcribe_{audio_file.name}', 
            ContentFile(audio_file.read())
        )
        temp_full_path = os.path.join(settings.MEDIA_ROOT, temp_path)
        print(f"Audio file saved to: {temp_full_path}")
        
        try:
            # Attempt transcription with Sarvam AI
            transcribed_text = transcribe_audio_with_sarvam(temp_full_path)
            
            # Clean up temporary file
            default_storage.delete(temp_path)
            print(f"Temporary file cleaned up: {temp_path}")
            
            if transcribed_text:
                print(f"Transcription successful: {transcribed_text[:100]}...")
                return Response({
                    'success': True,
                    'transcribed_text': transcribed_text
                })
            else:
                print("Transcription failed - no text returned")
                return Response({
                    'success': False,
                    'error': 'Transcription failed'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            # Clean up on error
            if default_storage.exists(temp_path):
                default_storage.delete(temp_path)
                print(f"Cleaned up temp file on error: {temp_path}")
            print(f"Error during transcription: {str(e)}")
            raise e
            
    except Exception as e:
        print(f"Error in transcribe_audio view: {e}")
        return Response(
            {'error': f'Error transcribing audio: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def process_text_input(request):
    """
    Process text input from user and create content if needed
    """
    try:
        text = request.data.get('text', '')
        user_token = request.data.get('token', '')  # Get user token from frontend
        
        if not text:
            return Response(
                {'error': 'No text provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"Processing text input: {text}")
        
        # Analyze intent
        intent_result = analyze_intent(text)
        
        # If it's an add_content action, actually create the content
        if intent_result['action'] == 'add_content' and user_token:
            content_data = intent_result['data']['content']
            
            # Create content in the main backend
            creation_result = create_content_in_backend(content_data, user_token)
            
            if creation_result['success']:
                return Response({
                    'success': True,
                    'input_text': text,
                    'action': 'content_created',
                    'data': {
                        'message': 'Content created successfully',
                        'content': creation_result['content']
                    }
                })
            else:
                return Response({
                    'success': False,
                    'input_text': text,
                    'action': 'add_content',
                    'data': intent_result['data'],
                    'error': creation_result['message']
                })
        
        # For other actions, return the intent analysis
        return Response({
            'success': True,
            'input_text': text,
            'action': intent_result['action'],
            'data': intent_result['data']
        })
        
    except Exception as e:
        return Response(
            {'error': f'Error processing text input: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def voice_status(request):
    """
    Check the status of voice processing dependencies
    """
    return Response({
        'gemini_available': GEMINI_AVAILABLE,
        'sarvam_configured': bool(SARVAM_API_KEY and SARVAM_API_KEY != 'your_sarvam_api_key_here'),
        'sarvam_client_available': True, # Direct HTTP requests, so always available
        'status': 'ready' if (GEMINI_AVAILABLE and SARVAM_API_KEY != 'your_sarvam_api_key_here') else 'limited',
        'note': 'Voice processing with direct HTTP requests to Sarvam AI API - English speech only',
        'language_requirement': 'English speech required for transcription'
    })
