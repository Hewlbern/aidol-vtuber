from pydantic import BaseModel, ConfigDict
from pathlib import Path
from typing import Dict

class ServerPaths(BaseModel):
    """Base class defining required paths for the WebSocketServer"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    live2d_models_dir: str | Path
    shared_assets_dir: str | Path
    cache_dir: str | Path

    @property
    def backgrounds_dir(self) -> Path:
        """Returns path to backgrounds directory"""
        return Path(self.shared_assets_dir) / "backgrounds"
    
    @property
    def avatars_dir(self) -> Path:
        """Returns path to avatars directory"""
        return Path(self.shared_assets_dir) / "avatars"
    
    @property 
    def assets_dir(self) -> Path:
        """Returns path to assets directory"""
        return Path(self.shared_assets_dir) / "assets"

class ServerConfig(BaseModel):
    """Configuration required by the WebSocketServer"""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    host: str
    port: int
    paths: ServerPaths 