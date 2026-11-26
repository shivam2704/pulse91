"""
pulse91/backend/main.py
Pulse91 - Dalal Street Intelligent Quant Terminal & Demat Gateway Server
"""

import asyncio
import json
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .routers.scanner_router import router as scanner_router
from .routers.demat_router import router as demat_router
from .routers.trade_router import router as trade_router
from .routers.alerts_router import router as alerts_router
from .services import market_data_engine
from .brokers import broker_engine, autotrader_engine

app = FastAPI(
    title="Pulse91 Dalal Street Quant Terminal",
    description="Institutional-grade stock selection, 5-Pillar Confluence Engine, and Demat Gateway for NSE/BSE",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

# Include Routers
app.include_router(scanner_router)
app.include_router(demat_router)
app.include_router(trade_router)
app.include_router(alerts_router)


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    regime = market_data_engine.get_market_regime()
    portfolio = broker_engine.get_portfolio_overview()
    return {
        "status": "ONLINE",
        "service": "Pulse91 Core Engine",
        "market": "NSE / BSE Live Simulator",
        "nifty_50": regime["nifty_ltp"],
        "regime": regime["regime_status"],
        "broker_mode": portfolio["mode"],
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
    }

# Active WebSocket Connections Pool
connected_clients = set()

async def autotrader_background_worker():
    """
    Runs in background, checking entry and exit conditions when autotrader is active.
    """
    while True:
        try:
            if autotrader_engine.is_active:
                await autotrader_engine.run_cycle()
        except Exception as e:
            print("AutoTrader background cycle error:", e)
        await asyncio.sleep(4.0)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(autotrader_background_worker())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True:
            # Broadcast live state every 2 seconds
            regime = market_data_engine.get_market_regime()
            portfolio = broker_engine.get_portfolio_overview()
            
            payload = {
                "type": "TICK_UPDATE",
                "timestamp": datetime.datetime.now().strftime("%H:%M:%S IST"),
                "market": {
                    "nifty_50": regime["nifty_ltp"],
                    "nifty_change_pct": regime["nifty_change_pct"],
                    "regime": regime["regime_status"],
                    "fii_dii_cr": regime["fii_dii_net_flow_cr"],
                    "fii_cr": regime.get("fii_cr"),
                    "dii_cr": regime.get("dii_cr"),
                    "fii_dii_date": regime.get("fii_dii_date"),
                    "is_market_open": regime.get("is_market_open", False),
                    "session_status": regime.get("session_status", "MARKET CLOSED")
                },
                "demat": portfolio
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(2.0)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)

# Mount Terminal static build if present (MUST BE AT THE END OF APP ROUTING)
terminal_dist = os.path.join(os.path.dirname(__file__), "..", "terminal", "dist")
if os.path.exists(terminal_dist):
    app.mount("/", StaticFiles(directory=terminal_dist, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("pulse91.core.main:app", host="0.0.0.0", port=8000, reload=True)
