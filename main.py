import warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.agents.utils import generate_llm_response, save_user_preferences_to_memory
from app.database_module.database import *
import numpy as np
from typing import List
import logging

from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
import logging

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

create_tables()  # Initialize the database tables
session_histories = {}
app = FastAPI()
# Mount static files for the frontend
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")


class SessionName(BaseModel):
    session_name: str

class Query(BaseModel):
    question: str
    mode: str = "planner"  # Default mode
    session_name: str = "Harish"

@app.get("/")
async def read_root():
    return {"message": "Welcome to the RAG System!"}




@app.post("/save_session")
async def save_chat_session(session: SessionName):
    try:
        save_session(session.session_name)  # Use session.session_name to get the name
        return {"message": "Session saved successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/query")
async def get_response(query: Query):
    # Initialize history for the session if it doesn't exist
    if query.session_name not in session_histories:
        session_histories[query.session_name] = []

    # Retrieve the history
    history = session_histories[query.session_name]

    # Generate response
    response_text, updated_history = generate_llm_response(
        query=query.question,
        mode=query.mode,
        history=history
    )

    # Update the session history
    session_histories[query.session_name] = updated_history

    return {"text_response": response_text}
@app.post("/save_session")
async def save_chat_session(session: SessionName):
    try:
        save_session(session.session_name)
        return {"message": "Session saved successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/load_session/{session_name}")
async def load_chat_session(session_name: str):
    messages = load_messages(session_name)
    if not messages:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"messages": [{"user_message": user, "bot_response": bot} for user, bot in messages]}

@app.delete("/delete_session/{session_name}")
async def delete_chat_session(session_name: str):
    try:
        delete_session(session_name)
        return {"message": "Session deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/list_sessions")
async def list_chat_sessions():
    try:
        sessions = list_sessions()
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SaveMessageRequest(BaseModel):
    session_name: str
    user_message: str
    bot_response: str

@app.post("/save_message")
async def save_message_endpoint(message: SaveMessageRequest):
    logger.info(f"Saving message: {message}")
    try:
        save_message(message.session_name, message.user_message, message.bot_response)
        return {"detail": "Message saved successfully."}
    except Exception as e:
        logger.error(f"Error saving message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/load_messages/{session_name}")
async def load_messages_endpoint(session_name: str):
    messages = load_messages(session_name)
    return [{"user_message": user, "bot_response": bot} for user, bot in messages]

class RenameSessionRequest(BaseModel):
    new_session_name: str

@app.put("/rename_session/{old_session_name}")
async def rename_session_route(old_session_name: str, request: RenameSessionRequest):
    print(f"Old session name: {old_session_name}, New session name: {request.new_session_name}")
    try:
        rename_session(old_session_name, request.new_session_name)
        return {"message": f"Session renamed from {old_session_name} to {request.new_session_name}"}
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
