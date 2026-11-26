"""
pulse91/core/config.py
Centralized Configuration & Settings Manager for Pulse91.
Loads and validates environment variables from .env.
"""

import os
from pathlib import Path
from typing import Optional
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
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "").strip()

    # Broker API Credentials (Optional - Default Sandbox)
    GROWW_API_KEY: Optional[str] = os.getenv("GROWW_API_KEY")
    GROWW_API_SECRET: Optional[str] = os.getenv("GROWW_API_SECRET")

    DHAN_CLIENT_ID: Optional[str] = os.getenv("DHAN_CLIENT_ID")
    DHAN_ACCESS_TOKEN: Optional[str] = os.getenv("DHAN_ACCESS_TOKEN")

    ZERODHA_API_KEY: Optional[str] = os.getenv("ZERODHA_API_KEY")
    ZERODHA_API_SECRET: Optional[str] = os.getenv("ZERODHA_API_SECRET")

    # WhatsApp & Webhook Alerts (Optional)
    WHATSAPP_PHONE: Optional[str] = os.getenv("WHATSAPP_PHONE")
    WHATSAPP_WEBHOOK_URL: Optional[str] = os.getenv("WHATSAPP_WEBHOOK_URL")

    # Financial / Sandbox Settings
    DEFAULT_SANDBOX_CAPITAL: float = 10000.00
    MAX_CAPITAL_PER_TRADE: float = 3000.00
    MAX_OPEN_POSITIONS: int = 3

settings = Settings()
