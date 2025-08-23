from django.urls import path
from . import views
from . import voice_views


urlpatterns = [
    path("", views.home_view, name="home"),
    
    path("api/voice/process/", voice_views.process_voice, name="process_voice"),
    path("api/voice/text/", voice_views.process_text_input, name="process_text_input"),
    path("api/voice/status/", voice_views.voice_status, name="voice_status"),
    path("api/voice/transcribe/", voice_views.transcribe_audio, name="transcribe_audio"),
]
