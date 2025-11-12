import json
from uuid import uuid4
import numpy as np
from datetime import datetime
from fastapi import APIRouter, WebSocket, UploadFile, File, Response
from starlette.websockets import WebSocketDisconnect
from loguru import logger
from .service_context import ServiceContext
from .websocket_handler import WebSocketHandler
from pathlib import Path
import os
from .config_manager.utils import read_yaml


def init_client_ws_route(default_context_cache: ServiceContext) -> APIRouter:
    """
    Create and return API routes for handling the `/client-ws` WebSocket connections.

    Args:
        default_context_cache: Default service context cache for new sessions.

    Returns:
        APIRouter: Configured router with WebSocket endpoint.
    """

    router = APIRouter()
    ws_handler = WebSocketHandler(default_context_cache)

    @router.websocket("/client-ws")
    async def websocket_endpoint(websocket: WebSocket):
        """WebSocket endpoint for client connections"""
        await websocket.accept()
        client_uid = str(uuid4())

        try:
            await ws_handler.handle_new_connection(websocket, client_uid)
            await ws_handler.handle_websocket_communication(websocket, client_uid)
        except WebSocketDisconnect:
            await ws_handler.handle_disconnect(client_uid)
        except Exception as e:
            logger.error(f"Error in WebSocket connection: {e}")
            await ws_handler.handle_disconnect(client_uid)
            raise

    return router


def init_webtool_routes(default_context_cache: ServiceContext) -> APIRouter:
    """
    Create and return API routes for handling web tool interactions.

    Args:
        default_context_cache: Default service context cache for new sessions.

    Returns:
        APIRouter: Configured router with WebSocket endpoint.
    """

    router = APIRouter()

    @router.get("/web-tool")
    async def web_tool_redirect():
        """Redirect /web-tool to /web_tool/index.html"""
        return Response(status_code=302, headers={"Location": "/web-tool/index.html"})

    @router.get("/web_tool")
    async def web_tool_redirect_alt():
        """Redirect /web_tool to /web_tool/index.html"""
        return Response(status_code=302, headers={"Location": "/web-tool/index.html"})

    @router.post("/asr")
    async def transcribe_audio(file: UploadFile = File(...)):
        """
        Endpoint for transcribing audio using the ASR engine
        """
        logger.info(f"Received audio file for transcription: {file.filename}")

        try:
            contents = await file.read()

            # Validate minimum file size
            if len(contents) < 44:  # Minimum WAV header size
                raise ValueError("Invalid WAV file: File too small")

            # Decode the WAV header and get actual audio data
            wav_header_size = 44  # Standard WAV header size
            audio_data = contents[wav_header_size:]

            # Validate audio data size
            if len(audio_data) % 2 != 0:
                raise ValueError("Invalid audio data: Buffer size must be even")

            # Convert to 16-bit PCM samples to float32
            try:
                audio_array = (
                    np.frombuffer(audio_data, dtype=np.int16).astype(np.float32)
                    / 32768.0
                )
            except ValueError as e:
                raise ValueError(
                    f"Audio format error: {str(e)}. Please ensure the file is 16-bit PCM WAV format."
                )

            # Validate audio data
            if len(audio_array) == 0:
                raise ValueError("Empty audio data")

            text = await default_context_cache.asr_engine.async_transcribe_np(
                audio_array
            )
            logger.info(f"Transcription result: {text}")
            return {"text": text}

        except ValueError as e:
            logger.error(f"Audio format error: {e}")
            return Response(
                content=json.dumps({"error": str(e)}),
                status_code=400,
                media_type="application/json",
            )
        except Exception as e:
            logger.error(f"Error during transcription: {e}")
            return Response(
                content=json.dumps(
                    {"error": "Internal server error during transcription"}
                ),
                status_code=500,
                media_type="application/json",
            )

    @router.websocket("/tts-ws")
    async def tts_endpoint(websocket: WebSocket):
        """WebSocket endpoint for TTS generation"""
        await websocket.accept()
        logger.info("TTS WebSocket connection established")

        try:
            while True:
                data = await websocket.receive_json()
                text = data.get("text")
                if not text:
                    continue

                logger.info(f"Received text for TTS: {text}")

                # Split text into sentences
                sentences = [s.strip() for s in text.split(".") if s.strip()]

                try:
                    # Generate and send audio for each sentence
                    for sentence in sentences:
                        sentence = sentence + "."  # Add back the period
                        file_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid4())[:8]}"
                        audio_path = (
                            await default_context_cache.tts_engine.async_generate_audio(
                                text=sentence, file_name_no_ext=file_name
                            )
                        )
                        logger.info(
                            f"Generated audio for sentence: {sentence} at: {audio_path}"
                        )

                        await websocket.send_json(
                            {
                                "status": "partial",
                                "audioPath": audio_path,
                                "text": sentence,
                            }
                        )

                    # Send completion signal
                    await websocket.send_json({"status": "complete"})

                except Exception as e:
                    logger.error(f"Error generating TTS: {e}")
                    await websocket.send_json({"status": "error", "message": str(e)})

        except WebSocketDisconnect:
            logger.info("TTS WebSocket client disconnected")
        except Exception as e:
            logger.error(f"Error in TTS WebSocket connection: {e}")
            await websocket.close()

    @router.get("/api/backgrounds")
    async def get_backgrounds():
        """Get list of available background images"""
        try:
            # Get backgrounds directory from system config
            backgrounds_dir = default_context_cache.system_config.backgrounds_dir
            
            # List all files in the backgrounds directory
            backgrounds = []
            
            # Use the existing mounted directory structure
            for filename in default_context_cache.system_config.get_backgrounds_path().glob("*"):
                # Check if file has valid image extension
                if filename.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
                    backgrounds.append({
                        "name": filename.stem,
                        "path": f"/bg/{filename.name}"  # Maps to the mounted /bg route
                    })
            
            logger.info(f"Found {len(backgrounds)} background images")
            return backgrounds

        except Exception as e:
            logger.error(f"Error getting backgrounds: {e}")
            return []

    @router.get("/api/base-config")
    async def get_base_config():
        """Get base configuration for Live2D viewer"""
        try:
            # Add debug info about current directory and paths
            logger.info(f"Current working directory: {os.getcwd()}")
            characters_dir = Path("config/characters")
            logger.info(f"Characters directory exists: {characters_dir.exists()}")
            logger.info(f"Characters directory absolute path: {characters_dir.absolute()}")
            
            # Get TTS config
            tts_config = default_context_cache.character_config.tts_config
            tts_model_name = tts_config.tts_model
            tts_model_config = getattr(tts_config, tts_model_name)

            # Get current character info
            current_character = {
                "id": default_context_cache.character_config.conf_uid,
                "name": default_context_cache.character_config.conf_name,
                "modelName": default_context_cache.character_config.live2d_model_name,
                "persona": default_context_cache.character_config.persona_prompt
            }
            logger.info(f"Current character: {current_character}")
            
            # Load all available characters with enhanced logging
            characters = []
            char_files = list(characters_dir.glob("*.yaml"))
            logger.info(f"Found {len(char_files)} character files: {[f.name for f in char_files]}")
            
            for char_file in char_files:
                try:
                    logger.info(f"Loading character from: {char_file}")
                    # Check file permissions
                    logger.info(f"File {char_file} readable: {os.access(char_file, os.R_OK)}")
                    
                    # Read and log file content preview
                    with open(char_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        logger.debug(f"File content preview: {content[:100]}...")
                    
                    char_config = read_yaml(char_file)
                    
                    if "character_config" in char_config:
                        char_data = char_config["character_config"]
                        char_id = char_data.get("conf_uid", char_file.stem)
                        model_name = char_data.get("live2d_model_name", "shizuku-local")
                        
                        logger.info(f"Adding character: {char_id} ({model_name})")
                        characters.append({
                            "id": char_id,
                            "name": char_data.get("conf_name", char_file.stem),
                            "modelName": model_name,
                            "persona": char_data.get("persona_prompt", "")
                        })
                    else:
                        logger.warning(f"No character_config section in {char_file}")
                except Exception as e:
                    logger.error(f"Error loading character {char_file}: {e}", exc_info=True)
            
            logger.info(f"Loaded {len(characters)} characters")

            # Build config object
            config = {
                "tts": {
                    "model": tts_model_name,
                    "voice": getattr(tts_model_config, "voice", ""),
                    "rate": 1.0,
                    "volume": 1.0
                },
                "character": current_character,
                "characters": characters
            }

            # Load model definitions
            try:
                model_dict_path = Path("config/live2d-models/model_dict.json")
                logger.info(f"Model dict exists: {model_dict_path.exists()}")
                
                with open(model_dict_path, "r", encoding="utf-8") as f:
                    model_data = json.load(f)
                    config["models"] = [
                        {
                            "name": model["name"],
                            "description": model.get("description", ""),
                            "url": model["url"]
                        } for model in model_data
                    ]
                logger.info(f"Loaded {len(config['models'])} models")
            except Exception as e:
                logger.error(f"Error loading model_dict.json: {e}", exc_info=True)
                config["models"] = []

            logger.info(f"Returning base config with {len(characters)} characters and {len(config.get('models', []))} models")
            return config

        except Exception as e:
            logger.error(f"Error loading base config: {e}", exc_info=True)
            return Response(
                content=json.dumps({
                    "error": str(e),
                    "models": [],
                    "characters": [],
                    "tts": {"model": "edge_tts", "voice": "", "rate": 1.0, "volume": 1.0},
                    "character": {"id": "default", "name": "Default", "modelName": "shizuku-local", "persona": ""}
                }),
                status_code=200,  # Return 200 with default config instead of 500
                media_type="application/json"
            )

    @router.post("/api/switch-character/{character_id}")
    async def switch_character(character_id: str):
        """Switch to a different character"""
        try:
            logger.info(f"Switching to character: {character_id}")
            
            # Find the character config file
            characters_dir = Path("config/characters")
            character_file = None
            
            # First try exact match on conf_uid
            logger.info("Searching for character by conf_uid...")
            for char_file in characters_dir.glob("*.yaml"):
                try:
                    char_config = read_yaml(char_file)
                    if "character_config" in char_config:
                        conf_uid = char_config["character_config"].get("conf_uid")
                        logger.debug(f"File {char_file.name} has conf_uid: {conf_uid}")
                        if conf_uid == character_id:
                            character_file = char_file
                            logger.info(f"Found character by conf_uid in {char_file}")
                            break
                except Exception as e:
                    logger.error(f"Error reading character file {char_file}: {e}")
            
            # If not found, try using the filename as fallback
            if not character_file:
                logger.info("Character not found by conf_uid, trying filename...")
                for char_file in characters_dir.glob("*.yaml"):
                    if char_file.stem == character_id:
                        character_file = char_file
                        logger.info(f"Found character by filename: {char_file}")
                        break
            
            if not character_file:
                logger.warning(f"Character {character_id} not found in any files")
                return Response(
                    content=json.dumps({"error": f"Character {character_id} not found"}),
                    status_code=404,
                    media_type="application/json"
                )
            
            # Load the character config
            logger.info(f"Loading character config from {character_file}")
            
            # Validate the character file before loading
            try:
                char_config = read_yaml(character_file)
                if "character_config" not in char_config:
                    raise ValueError(f"Missing character_config section in {character_file}")
                    
                required_fields = ["conf_name", "conf_uid", "live2d_model_name"]
                missing_fields = [field for field in required_fields if field not in char_config["character_config"]]
                if missing_fields:
                    raise ValueError(f"Missing required fields in {character_file}: {missing_fields}")
                    
                logger.info(f"Character file validated successfully: {character_file}")
            except Exception as e:
                logger.error(f"Character file validation failed: {e}")
                return Response(
                    content=json.dumps({"error": f"Invalid character file: {str(e)}"}),
                    status_code=400,
                    media_type="application/json"
                )
            
            # Load the character config
            default_context_cache.load_character_config(character_file)
            
            # Get the updated character info to return
            updated_character = {
                "id": default_context_cache.character_config.conf_uid,
                "name": default_context_cache.character_config.conf_name,
                "modelName": default_context_cache.character_config.live2d_model_name,
                "persona": default_context_cache.character_config.persona_prompt
            }
            
            logger.info(f"Successfully switched to character: {updated_character['name']}")
            return {
                "success": True, 
                "message": f"Switched to character {character_id}",
                "character": updated_character
            }
        
        except Exception as e:
            logger.error(f"Error switching character: {e}", exc_info=True)
            return Response(
                content=json.dumps({"error": str(e)}),
                status_code=500,
                media_type="application/json"
            )

    return router
