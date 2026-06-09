from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    app_name: str = "Carbon Time Machine"
    debug: bool = False

    model_config = {"env_file": ".env"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
