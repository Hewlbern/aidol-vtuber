"""Unit tests for backend adapters"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any

from src.open_llm_vtuber.adapters import BackendAdapter, OrphiqAdapter
from src.open_llm_vtuber.service_context import ServiceContext
from src.open_llm_vtuber.agent.output_types import SentenceOutput, DisplayText, Actions


@pytest.fixture
def mock_service_context():
    """Create a mock service context"""
    context = MagicMock(spec=ServiceContext)
    context.character_config.character_name = "TestCharacter"
    context.character_config.human_name = "Human"
    context.character_config.avatar = "test.png"
    context.character_config.conf_uid = "test-conf-uid"
    
    # Mock agent engine
    context.agent_engine = MagicMock()
    
    return context


@pytest.fixture
def mock_websocket_send():
    """Create a mock websocket send function"""
    return AsyncMock()


@pytest.fixture
def orphiq_adapter(mock_service_context, mock_websocket_send):
    """Create an OrphiqAdapter instance"""
    return OrphiqAdapter(
        service_context=mock_service_context,
        websocket_send=mock_websocket_send,
    )


class TestBackendAdapter:
    """Test base adapter interface"""

    def test_backend_adapter_is_abstract(self):
        """Test that BackendAdapter is abstract and cannot be instantiated"""
        with pytest.raises(TypeError):
            BackendAdapter()


class TestOrphiqAdapter:
    """Test OrphiqAdapter implementation"""

    @pytest.mark.asyncio
    async def test_generate_text_basic(self, orphiq_adapter, mock_service_context):
        """Test basic text generation"""
        # Mock agent output
        mock_output = SentenceOutput(
            display_text=DisplayText(text="Hello, world!"),
            tts_text="Hello, world!",
            actions=Actions(),
        )
        
        async def mock_chat(input_data):
            yield mock_output
        
        mock_service_context.agent_engine.chat = mock_chat
        
        # Generate text
        texts = []
        async for text in orphiq_adapter.generate_text("Test prompt"):
            texts.append(text)
        
        assert len(texts) == 1
        assert texts[0] == "Hello, world!"

    @pytest.mark.asyncio
    async def test_generate_text_multiple_chunks(self, orphiq_adapter, mock_service_context):
        """Test text generation with multiple chunks"""
        # Mock agent output with multiple sentences
        outputs = [
            SentenceOutput(
                display_text=DisplayText(text="Hello, "),
                tts_text="Hello, ",
                actions=Actions(),
            ),
            SentenceOutput(
                display_text=DisplayText(text="world!"),
                tts_text="world!",
                actions=Actions(),
            ),
        ]
        
        async def mock_chat(input_data):
            for output in outputs:
                yield output
        
        mock_service_context.agent_engine.chat = mock_chat
        
        # Generate text
        texts = []
        async for text in orphiq_adapter.generate_text("Test prompt"):
            texts.append(text)
        
        assert len(texts) == 2
        assert "".join(texts) == "Hello, world!"

    @pytest.mark.asyncio
    async def test_trigger_expression(self, orphiq_adapter, mock_websocket_send):
        """Test expression triggering"""
        result = await orphiq_adapter.trigger_expression(
            expression_id=0,
            duration=1000,
            priority=1,
        )
        
        assert result["status"] == "success"
        assert result["expression_id"] == 0
        assert result["duration"] == 1000
        assert result["priority"] == 1
        
        # Verify websocket send was called
        assert mock_websocket_send.called
        call_args = mock_websocket_send.call_args[0][0]
        import json
        payload = json.loads(call_args)
        assert payload["type"] == "audio"
        assert payload["actions"]["expressions"] == [0]

    @pytest.mark.asyncio
    async def test_trigger_motion(self, orphiq_adapter, mock_websocket_send):
        """Test motion triggering"""
        result = await orphiq_adapter.trigger_motion(
            motion_group="idle",
            motion_index=0,
            loop=True,
            priority=1,
        )
        
        assert result["status"] == "success"
        assert result["motion_group"] == "idle"
        assert result["motion_index"] == 0
        assert result["loop"] is True
        
        # Verify websocket send was called
        assert mock_websocket_send.called

    @pytest.mark.asyncio
    async def test_get_character_state(self, orphiq_adapter):
        """Test getting character state"""
        state = await orphiq_adapter.get_character_state()
        
        assert "character_name" in state
        assert "model_name" in state
        assert "current_expression" in state
        assert "current_motion" in state
        assert state["character_name"] == "TestCharacter"

    @pytest.mark.asyncio
    async def test_trigger_expression_updates_state(self, orphiq_adapter):
        """Test that triggering expression updates internal state"""
        await orphiq_adapter.trigger_expression(expression_id=1)
        
        state = await orphiq_adapter.get_character_state()
        assert state["current_expression"] == 1

    @pytest.mark.asyncio
    async def test_trigger_motion_updates_state(self, orphiq_adapter):
        """Test that triggering motion updates internal state"""
        await orphiq_adapter.trigger_motion("idle", 0)
        
        state = await orphiq_adapter.get_character_state()
        assert state["current_motion"] is not None
        assert state["current_motion"]["group"] == "idle"
        assert state["current_motion"]["index"] == 0

