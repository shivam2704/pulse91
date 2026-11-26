"""
pulse91/core/config.py
Centralized Configuration & Settings Manager for Pulse91.
Loads and validates environment variables from .env.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE)

class Settings:
    # Server Configuration
    ENV: str = os.getenv("ENV", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Supabase PostgreSQL Configuration
    SUPABASE_URL: str = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "").strip()
    SUPABASE_KEY: str = (os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "").strip()

    # Financial / Sandbox Defaults
    DEFAULT_SANDBOX_CAPITAL: float = 10000.00
    MAX_CAPITAL_PER_TRADE: float = 3000.00
    MAX_OPEN_POSITIONS: int = 3

settings = Settings()
