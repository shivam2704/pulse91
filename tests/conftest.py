import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from pulse91.core.main import app

@pytest.fixture(scope="session")
def client():
    return TestClient(app)
