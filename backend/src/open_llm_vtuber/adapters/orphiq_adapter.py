"""Orphiq backend adapter - wraps existing orphiq functionality"""

import json
from typing import Optional, Dict, Any, AsyncIterator, Callable, Awaitable
from loguru import logger

from .base_adapter import BackendAdapter
from ..service_context import ServiceContext
from ..conversations.conversation_utils import create_batch_input
from ..agent.output_types import SentenceOutput, AudioOutput


class OrphiqAdapter(BackendAdapter):
    """Adapter for existing orphiq backend"""

    def __init__(
        self,
        service_context: ServiceContext,
        websocket_send: Callable[[str], Awaitable[None]],
    ):
        """
        Initialize Orphiq adapter

        Args:
            service_context: Service context with all engines
            websocket_send: Function to send WebSocket messages
        """
        self.context = service_context
        self.websocket_send = websocket_send
        self._current_expression: Optional[int] = None
        self._current_motion: Optional[Dict[str, Any]] = None

    async def generate_text(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[str]:
        """
        Generate text using existing agent engine

        Args:
            prompt: Input prompt text
            context: Optional context dictionary (not used in orphiq mode)

        Yields:
            str: Text chunks as they are generated
        """
        try:
            # Create batch input using existing utility
            batch_input = create_batch_input(
                input_text=prompt,
                images=None,
                from_name=self.context.character_config.human_name,
            )

            # Use existing agent engine
            agent_output = self.context.agent_engine.chat(batch_input)

            # Process output and yield text
            async for output in agent_output:
                if isinstance(output, SentenceOutput):
                    yield output.display_text.text
                elif isinstance(output, AudioOutput):
                    yield output.transcript
                else:
                    logger.warning(f"Unknown output type: {type(output)}")

        except Exception as e:
            logger.error(f"Error generating text in OrphiqAdapter: {e}")
            raise

    async def trigger_expression(
        self,
        expression_id: int,
        duration: Optional[int] = None,
        priority: int = 0,
    ) -> Dict[str, Any]:
        """
        Trigger expression by sending action via WebSocket

        Args:
            expression_id: Expression ID to trigger
            duration: Duration in milliseconds (0 = permanent)
            priority: Priority level (currently not used in orphiq)

        Returns:
            dict: Result dictionary
        """
        try:
            # Create actions payload
            from ..agent.output_types import Actions

            actions = Actions(expressions=[expression_id])

            # Send via WebSocket as audio payload (without audio)
            payload = {
                "type": "audio",
                "audio": None,
                "volumes": [],
                "slice_length": 20,
                "display_text": {
                    "text": f"Expression {expression_id}",
                    "name": self.context.character_config.character_name,
                    "avatar": self.context.character_config.avatar,
                },
                "actions": actions.to_dict(),
                "forwarded": False,
            }

            # Send via websocket
            await self.websocket_send(json.dumps(payload))

            self._current_expression = expression_id

            return {
                "status": "success",
                "expression_id": expression_id,
                "duration": duration,
                "priority": priority,
            }

        except Exception as e:
            logger.error(f"Error triggering expression: {e}")
            return {
                "status": "error",
                "error": str(e),
            }

    async def trigger_motion(
        self,
        motion_group: str,
        motion_index: int,
        loop: bool = False,
        priority: int = 0,
    ) -> Dict[str, Any]:
        """
        Trigger motion (Note: Full motion support requires Live2D model integration)

        Args:
            motion_group: Motion group name
            motion_index: Motion index within group
            loop: Whether to loop the motion
            priority: Priority level (currently not used in orphiq)

        Returns:
            dict: Result dictionary
        """
        try:
            # For now, we'll send a message indicating motion request
            # Full motion integration requires Live2D model API access
            payload = {
                "type": "motion-command",
                "motion_group": motion_group,
                "motion_index": motion_index,
                "loop": loop,
                "priority": priority,
            }

            await self.websocket_send(json.dumps(payload))

            self._current_motion = {
                "group": motion_group,
                "index": motion_index,
                "loop": loop,
            }

            return {
                "status": "success",
                "motion_group": motion_group,
                "motion_index": motion_index,
                "loop": loop,
                "priority": priority,
            }

        except Exception as e:
            logger.error(f"Error triggering motion: {e}")
            return {
                "status": "error",
                "error": str(e),
            }

    async def get_character_state(self) -> Dict[str, Any]:
        """
        Get current character state

        Returns:
            dict: Current character state
        """
        return {
            "character_name": self.context.character_config.character_name,
            "model_name": self.context.live2d_model.live2d_model_name,
            "current_expression": self._current_expression,
            "current_motion": self._current_motion,
            "config_uid": self.context.character_config.conf_uid,
        }

