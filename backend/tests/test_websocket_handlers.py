"""Unit tests for new WebSocket handlers"""

import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import WebSocket

from src.open_llm_vtuber.websocket_handler import WebSocketHandler
from src.open_llm_vtuber.service_context import ServiceContext
from src.open_llm_vtuber.adapters import OrphiqAdapter


@pytest.fixture
def mock_service_context():
    """Create a mock service context"""
    context = MagicMock(spec=ServiceContext)
    context.character_config.character_name = "TestCharacter"
    context.character_config.human_name = "Human"
    context.character_config.avatar = "test.png"
    context.character_config.conf_uid = "test-conf-uid"
    context.live2d_model.live2d_model_name = "test_model"
    context.agent_engine = MagicMock()
    return context


@pytest.fixture
def mock_websocket():
    """Create a mock WebSocket"""
    ws = AsyncMock(spec=WebSocket)
    ws.send_text = AsyncMock()
    return ws


@pytest.fixture
def websocket_handler(mock_service_context):
    """Create a WebSocketHandler instance"""
    return WebSocketHandler(default_context_cache=mock_service_context)


@pytest.fixture
def client_uid():
    """Return a test client UID"""
    return "test-client-123"


class TestWebSocketHandlers:
    """Test new WebSocket message handlers"""

    @pytest.mark.asyncio
    async def test_expression_command_handler(
        self, websocket_handler, mock_websocket, client_uid, mock_service_context
    ):
        """Test expression command handler"""
        # Setup
        websocket_handler.client_connections[client_uid] = mock_websocket
        websocket_handler.client_contexts[client_uid] = mock_service_context
        
        # Mock adapter
        mock_adapter = AsyncMock()
        mock_adapter.trigger_expression.return_value = {
            "status": "success",
            "expression_id": 0,
        }
        websocket_handler.client_adapters[client_uid] = mock_adapter
        
        # Test data
        data = {
            "type": "expression-command",
            "expression_id": 0,
            "duration": 1000,
            "priority": 1,
        }
        
        # Call handler
        await websocket_handler._handle_expression_command(
            mock_websocket, client_uid, data
        )
        
        # Verify
        assert mock_websocket.send_text.called
        call_args = json.loads(mock_websocket.send_text.call_args[0][0])
        assert call_args["type"] == "expression-ack"
        assert call_args["expression_id"] == 0

    @pytest.mark.asyncio
    async def test_expression_command_missing_id(
        self, websocket_handler, mock_websocket, client_uid, mock_service_context
    ):
        """Test expression command with missing expression_id"""
        websocket_handler.client_connections[client_uid] = mock_websocket
        websocket_handler.client_contexts[client_uid] = mock_service_context
        
        data = {"type": "expression-command"}
        
        await websocket_handler._handle_expression_command(
            mock_websocket, client_uid, data
        )
        
        call_args = json.loads(mock_websocket.send_text.call_args[0][0])
        assert call_args["type"] == "error"
        assert "expression_id" in call_args["message"].lower()

    @pytest.mark.asyncio
    async def test_motion_command_handler(
        self, websocket_handler, mock_websocket, client_uid, mock_service_context
    ):
        """Test motion command handler"""
        websocket_handler.client_connections[client_uid] = mock_websocket
        websocket_handler.client_contexts[client_uid] = mock_service_context
        
        mock_adapter = AsyncMock()
        mock_adapter.trigger_motion.return_value = {
            "status": "success",
            "motion_group": "idle",
            "motion_index": 0,
        }
        websocket_handler.client_adapters[client_uid] = mock_adapter
        
        data = {
            "type": "motion-command",
            "motion_group": "idle",
            "motion_index": 0,
            "loop": False,
        }
        
        await websocket_handler._handle_motion_command(
            mock_websocket, client_uid, data
        )
        
        assert mock_websocket.send_text.called
        call_args = json.loads(mock_websocket.send_text.call_args[0][0])
        assert call_args["type"] == "motion-ack"
        assert call_args["motion_group"] == "idle"

    @pytest.mark.asyncio
    async def test_text_generation_request_handler(
        self, websocket_handler, mock_websocket, client_uid, mock_service_context
    ):
        """Test text generation request handler"""
        websocket_handler.client_connections[client_uid] = mock_websocket
        websocket_handler.client_contexts[client_uid] = mock_service_context
        
        mock_adapter = AsyncMock()
        
        async def mock_generate_text(prompt, context=None):
            yield "Hello, "
            yield "world!"
        
        mock_adapter.generate_text = mock_generate_text
        websocket_handler.client_adapters[client_uid] = mock_adapter
        
        data = {
            "type": "text-generation-request",
            "prompt": "Say hello",
        }
        
        await websocket_handler._handle_text_generation_request(
            mock_websocket, client_uid, data
        )
        
        # Should have sent chunks and final response
        assert mock_websocket.send_text.call_count >= 2
        
        # Check final response
        final_call = mock_websocket.send_text.call_args_list[-1]
        final_data = json.loads(final_call[0][0])
        assert final_data["type"] == "text-generation-response"
        assert final_data["is_complete"] is True
        assert "Hello, world!" in final_data["text"]

    @pytest.mark.asyncio
    async def test_set_backend_mode_handler(
        self, websocket_handler, mock_websocket, client_uid, mock_service_context
    ):
        """Test set backend mode handler"""
        websocket_handler.client_connections[client_uid] = mock_websocket
        websocket_handler.client_contexts[client_uid] = mock_service_context
        
        data = {
            "type": "set-backend-mode",
            "mode": "orphiq",
        }
        
        await websocket_handler._handle_set_backend_mode(
            mock_websocket, client_uid, data
        )
        
        assert mock_websocket.send_text.called
        call_args = json.loads(mock_websocket.send_text.call_args[0][0])
        assert call_args["type"] == "backend-mode-set"
        assert call_args["mode"] == "orphiq"
        assert websocket_handler.backend_modes[client_uid] == "orphiq"

    @pytest.mark.asyncio
    async def test_set_backend_mode_invalid(
        self, websocket_handler, mock_websocket, client_uid, mock_service_context
    ):
        """Test set backend mode with invalid mode"""
        websocket_handler.client_connections[client_uid] = mock_websocket
        websocket_handler.client_contexts[client_uid] = mock_service_context
        
        data = {
            "type": "set-backend-mode",
            "mode": "invalid-mode",
        }
        
        await websocket_handler._handle_set_backend_mode(
            mock_websocket, client_uid, data
        )
        
        call_args = json.loads(mock_websocket.send_text.call_args[0][0])
        assert call_args["type"] == "error"

    @pytest.mark.asyncio
    async def test_get_backend_mode_handler(
        self, websocket_handler, mock_websocket, client_uid
    ):
        """Test get backend mode handler"""
        websocket_handler.client_connections[client_uid] = mock_websocket
        websocket_handler.backend_modes[client_uid] = "orphiq"
        
        data = {"type": "get-backend-mode"}
        
        await websocket_handler._handle_get_backend_mode(
            mock_websocket, client_uid, data
        )
        
        assert mock_websocket.send_text.called
        call_args = json.loads(mock_websocket.send_text.call_args[0][0])
        assert call_args["type"] == "backend-mode"
        assert call_args["mode"] == "orphiq"

    @pytest.mark.asyncio
    async def test_get_adapter_creates_orphiq_adapter(
        self, websocket_handler, client_uid, mock_service_context
    ):
        """Test that _get_adapter creates OrphiqAdapter by default"""
        websocket_handler.client_connections[client_uid] = AsyncMock()
        websocket_handler.client_contexts[client_uid] = mock_service_context
        
        adapter = websocket_handler._get_adapter(client_uid)
        
        assert adapter is not None
        assert isinstance(adapter, OrphiqAdapter)
        assert client_uid in websocket_handler.client_adapters

