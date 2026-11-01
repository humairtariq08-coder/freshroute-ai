"""Optional live PostgreSQL checks. Set TEST_DATABASE_URL to enable."""
from concurrent.futures import ThreadPoolExecutor
import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from backend import main


@unittest.skipUnless(os.getenv("TEST_DATABASE_URL", "").startswith(("postgresql://", "postgres://")), "TEST_DATABASE_URL not configured")
class PostgreSQLTests(unittest.TestCase):
    def test_concurrent_reservations_do_not_oversell(self):
        url = os.environ["TEST_DATABASE_URL"]
        with patch.dict(os.environ, {"DATABASE_URL": url}):
            with TestClient(main.app) as client:
                product = client.post("/api/products", json={"name": "Postgres concurrency crop", "price": 10, "quantity": 5}).json()
                payload = {"product_id": product["id"], "quantity": 1, "buyer": "Concurrency test"}
                with ThreadPoolExecutor(max_workers=10) as pool:
                    statuses = list(pool.map(lambda _: client.post("/api/orders", json=payload).status_code, range(10)))
                self.assertEqual(statuses.count(201), 5)
                self.assertEqual(statuses.count(409), 5)
