from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from bson.objectid import ObjectId
from pymongo import MongoClient
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from numpy import dot
from numpy.linalg import norm
import numpy as np

# MongoDB setup
client = MongoClient("mongodb+srv://jaychopda:Jay1234@unstoppable.somfy.mongodb.net/")
db = client["SecondBrain"]

# Gemini setup
genai.configure(api_key="AIzaSyBsroOlIDtMUcn0Z7n-BjKQGR6KhdgI44E")
AImodel = genai.GenerativeModel("gemini-1.5-flash")

# Embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')


# --- Utils ---
def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return dot(a, b) / (norm(a) * norm(b))


def convert_objectid_to_string(obj):
    from bson import ObjectId
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: convert_objectid_to_string(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid_to_string(i) for i in obj]
    return obj


def search_notes(query, top_k, notes):
    query_vec = model.encode(query).tolist()

    for note in notes:
        note['embedding'] = model.encode(note.get('title', "")).tolist()

    scored_notes = []
    for note in notes:
        score = cosine_similarity(query_vec, note['embedding'])
        scored_notes.append((note, score))

    scored_notes.sort(key=lambda x: x[1], reverse=True)

    return [{
        "type": note.get("type", ""),
        "title": note.get('title', ''),
        "tags": note.get("tags", []),
        "score": float(score),
        "link": note.get("link", "")
    } for note, score in scored_notes[:top_k]]


# --- API Endpoints ---

def home_view(request):
    """Simple home view to eliminate 404 on root path"""
    return JsonResponse({
        "message": "Second Brain Voice API",
        "status": "running",
        "endpoints": {
            "voice_process": "/api/voice/process/",
            "voice_test": "/api/voice/test/",
            "voice_status": "/api/voice/status/",
            "search": "/api/search/",
            "ask": "/api/ask/"
        }
    })


@api_view(["POST"])
def search_notes_view(request):
    try:
        query = request.data.get("query")
        top = int(request.data.get("top", 5))
        user_id = request.data.get("userId")

        userId = ObjectId(user_id)
        notes_collection = list(db["contents"].find({"userId": userId}))
        notes_collection = convert_objectid_to_string(notes_collection)

        results = search_notes(query, top, notes_collection)
        return Response(results)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
def ask_gemini_view(request):
    try:
        query = request.data.get("query")
        user_id = request.data.get("userId")
        ref = request.data.get("ref", None)

        if ref:
            query = f"{query} Reference: {ref}"

        response = AImodel.generate_content(query)

        # Fetch notes (not used here, but same as FastAPI)
        _ = list(db["contents"].find({"userId": user_id}))

        return Response({"response": response.text})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
