import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from backend import main


class APITests(unittest.TestCase):
    def test_health_and_ai_failure_independence(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(main, "database_path", Path(folder) / "test.db"), patch.dict(os.environ, {"GEMMA_API_KEY": ""}):
            with TestClient(main.app) as client:
                self.assertEqual(client.get("/api/health").json()["database"], "ok")
                self.assertEqual(client.get("/api/ai/status").json()["status"], "NOT_CONFIGURED")
                response = client.post("/api/ai/assist", json={"task": "description", "data": {"produce": "tomatoes"}})
                self.assertEqual(response.status_code, 503)
                self.assertNotIn("text", response.json())
                self.assertEqual(client.get("/api/health").status_code, 200)
                self.assertEqual(client.post("/api/ai/assist", json={"task": "unknown"}).status_code, 422)
                cors = client.options("/api/ai/assist", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"})
                self.assertEqual(cors.status_code, 200)
                self.assertEqual(cors.headers["access-control-allow-origin"], "http://localhost:5173")
                denied = client.options("/api/ai/assist", headers={"Origin": "https://example.org", "Access-Control-Request-Method": "POST"})
                self.assertEqual(denied.status_code, 400)


if __name__ == "__main__":
    unittest.main()
