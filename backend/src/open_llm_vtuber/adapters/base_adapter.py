"""Base adapter interface for backend abstraction"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, AsyncIterator


class BackendAdapter(ABC):
    """Base interface for all backend adapters"""

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[str]:
        """
        Generate text response

        Args:
            prompt: Input prompt text
            context: Optional context dictionary

        Yields:
            str: Text chunks as they are generated
        """
        pass

    @abstractmethod
    async def trigger_expression(
        self,
        expression_id: int,
        duration: Optional[int] = None,
        priority: int = 0,
    ) -> Dict[str, Any]:
        """
        Trigger character expression

        Args:
            expression_id: Expression ID to trigger
            duration: Duration in milliseconds (0 = permanent)
            priority: Priority level (higher = more important)

        Returns:
            dict: Result dictionary with status information
        """
        pass

    @abstractmethod
    async def trigger_motion(
        self,
        motion_group: str,
        motion_index: int,
        loop: bool = False,
        priority: int = 0,
    ) -> Dict[str, Any]:
        """
        Trigger character motion

        Args:
            motion_group: Motion group name
            motion_index: Motion index within group
            loop: Whether to loop the motion
            priority: Priority level (higher = more important)

        Returns:
            dict: Result dictionary with status information
        """
        pass

    @abstractmethod
    async def get_character_state(self) -> Dict[str, Any]:
        """
        Get current character state

        Returns:
            dict: Current character state information
        """
        pass

