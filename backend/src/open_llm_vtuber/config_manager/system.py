# config_manager/system.py
from pydantic import Field, model_validator, ConfigDict
from typing import Dict, ClassVar
from pathlib import Path
from .i18n import I18nMixin, Description
from .interfaces import ServerPaths


class SystemConfig(I18nMixin, ServerPaths):
    """System configuration settings."""
    model_config = ConfigDict(arbitrary_types_allowed=True)

    conf_version: str = Field(..., alias="conf_version")
    host: str = Field(..., alias="host")
    port: int = Field(..., alias="port")
    config_alts_dir: str = Field(..., alias="config_alts_dir")
    tool_prompts: Dict[str, str] = Field(..., alias="tool_prompts")
    
    # Base paths
    live2d_models_dir: str = Field(default="config/live2d-models", alias="live2d_models_dir")
    shared_assets_dir: str = Field(default="config/shared", alias="shared_assets_dir")
    cache_dir: str = Field(default="cache", alias="cache_dir")
    backgrounds_dir: str = Field(default="config/shared/backgrounds", alias="backgrounds_dir")
    characters_dir: str = Field(default="config/characters", alias="characters_dir")

    DESCRIPTIONS: ClassVar[Dict[str, Description]] = {
        "conf_version": Description(en="Configuration version", zh="配置文件版本"),
        "host": Description(en="Server host address", zh="服务器主机地址"),
        "port": Description(en="Server port number", zh="服务器端口号"),
        "config_alts_dir": Description(
            en="Directory for alternative configurations", zh="备用配置目录"
        ),
        "tool_prompts": Description(
            en="Tool prompts to be inserted into persona prompt",
            zh="要插入到角色提示词中的工具提示词",
        ),
        "live2d_models_dir": Description(
            en="Directory containing Live2D models", 
            zh="Live2D模型目录"
        ),
        "shared_assets_dir": Description(
            en="Directory containing shared assets", 
            zh="共享资源目录"
        ),
        "cache_dir": Description(
            en="Directory for cached files",
            zh="缓存文件目录"
        ),
        "backgrounds_dir": Description(
            en="Directory containing background images",
            zh="背景图像目录"
        ),
        "characters_dir": Description(
            en="Directory containing character configurations",
            zh="角色配置目录"
        ),
    }

    @model_validator(mode="after")
    def check_port(cls, values):
        port = values.port
        if port < 0 or port > 65535:
            raise ValueError("Port must be between 0 and 65535")
        return values

    def get_backgrounds_path(self) -> Path:
        """Returns path to backgrounds directory"""
        return Path(self.backgrounds_dir)
    
    def get_characters_path(self) -> Path:
        """Returns path to character configs directory"""
        return Path(self.characters_dir)

    @property
    def avatars_dir(self) -> Path:
        """Returns path to avatars directory"""
        return Path(self.shared_assets_dir) / "avatars"
    
    @property 
    def assets_dir(self) -> Path:
        """Returns path to assets directory"""
        return Path(self.shared_assets_dir) / "assets"

    @property
    def live2d_models_path(self) -> Path:
        """Returns absolute path to live2d models directory"""
        return Path(self.live2d_models_dir).resolve()

    @property 
    def model_paths(self) -> Dict[str, Path]:
        """Returns mapping of model names to their paths"""
        paths = {}
        for model_dir in self.live2d_models_path.iterdir():
            if model_dir.is_dir():
                model_json = list(model_dir.glob("*.model.json"))
                if model_json:
                    paths[model_dir.name] = model_json[0]
        return paths

    @property
    def backgrounds_path(self) -> Path:
        """Returns path to backgrounds directory"""
        return Path(self.backgrounds_dir)
