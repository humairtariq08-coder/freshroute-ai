from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from backend import main


class MarketplaceTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.path = patch.object(main, "database_path", Path(self.folder.name) / "market.db")
        self.path.start()
        self.addCleanup(self.path.stop)
        self.client = TestClient(main.app)
        self.client.__enter__()
        self.addCleanup(self.client.__exit__, None, None, None)

    def test_demo_seed_and_persistence(self):
        snapshot = self.client.get("/api/marketplace").json()
        self.assertEqual(len(snapshot["products"]), 12)
        self.assertTrue(all(p["demo"] for p in snapshot["products"]))
        self.assertEqual(len(snapshot["history"]), 7)
        self.assertEqual(snapshot["summary"]["forecast"]["evaluation"], "expanding-window one-step-ahead MAE")
        self.assertGreater(snapshot["summary"]["forecast"]["methods"]["moving_average"]["test_points"], 0)
        result = self.client.post("/api/products", json={"name": "Test apples", "price": 200, "quantity": 10})
        self.assertEqual(result.status_code, 201)
        self.assertFalse(result.json()["demo"])
        self.assertEqual(len(self.client.get("/api/products").json()), 13)
        main.marketplace.initialize(main.database_path)
        self.assertEqual(len(self.client.get("/api/products").json()), 13)

    def test_orders_stock_and_validation(self):
        product = self.client.get("/api/products").json()[0]
        payload = {"product_id": product["id"], "quantity": 5, "buyer": "Test buyer"}
        response = self.client.post("/api/orders", json=payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["total"], round(product["price"]*5, 2))
        updated = next(p for p in self.client.get("/api/products").json() if p["id"] == product["id"])
        self.assertEqual(updated["quantity"], product["quantity"]-5)
        self.assertEqual(self.client.post("/api/orders", json={**payload, "quantity": 1000000}).status_code, 409)
        self.assertEqual(self.client.post("/api/orders", json={**payload, "quantity": -1}).status_code, 422)
        self.assertEqual(self.client.post("/api/orders", json={**payload, "product_id": 99999}).status_code, 404)
        self.assertEqual(len(self.client.get("/api/orders").json()), 1)

    def test_competing_orders_do_not_oversell(self):
        product = self.client.post("/api/products", json={"name": "Rare fruit", "price": 10, "quantity": 5}).json()
        payload = {"product_id": product["id"], "quantity": 1, "buyer": "Test buyer"}
        with ThreadPoolExecutor(max_workers=10) as pool:
            statuses = list(pool.map(lambda _: self.client.post("/api/orders", json=payload).status_code, range(10)))
        self.assertEqual(statuses.count(201), 5)
        self.assertEqual(statuses.count(409), 5)
        updated = next(p for p in self.client.get("/api/products").json() if p["id"] == product["id"])
        self.assertEqual(updated["quantity"], 0)
        created = [order for order in self.client.get("/api/orders").json() if order["product_id"] == product["id"]]
        self.assertEqual(len(created), 5)

    def test_matching_uses_actual_records(self):
        product = self.client.post("/api/products", json={"name": "Test guava", "price": 80, "quantity": 12}).json()
        requirement = self.client.post("/api/requirements", json={"buyer": "Test buyer", "produce": "guava", "quantity": 20, "max_price": 100}).json()
        match = next(m for m in self.client.get("/api/matches").json() if m["product"]["id"] == product["id"])
        self.assertEqual(match["requirement"]["id"], requirement["id"])
        self.assertEqual(match["quantity"], 12)
        self.assertEqual(match["score"], 60)
        self.assertFalse(match["demo"])
        self.assertEqual(match["savings"], 240)

    def test_matching_ranks_nearer_supplier_without_changing_fulfillment_score(self):
        near = self.client.post("/api/products", json={"name": "Local okra", "price": 80, "quantity": 20, "lat": 24.86, "lng": 67.01}).json()
        far = self.client.post("/api/products", json={"name": "Distant okra", "price": 70, "quantity": 20, "lat": 32.08, "lng": 72.67}).json()
        requirement = self.client.post("/api/requirements", json={"buyer": "Test buyer", "produce": "okra", "quantity": 20, "max_price": 100, "lat": 24.87, "lng": 67.02}).json()
        matches = [item for item in self.client.get("/api/matches").json() if item["requirement"]["id"] == requirement["id"]]
        self.assertEqual([item["product"]["id"] for item in matches], [near["id"], far["id"]])
        self.assertEqual(matches[0]["score"], 100)
        self.assertGreater(matches[0]["ranking_score"], matches[1]["ranking_score"])
        self.assertLess(matches[0]["distance_km"], matches[1]["distance_km"])

    def test_matching_normalizes_synonyms_and_spelling(self):
        product = self.client.post("/api/products", json={"name": "Fresh tomatoes", "price": 80, "quantity": 20}).json()
        requirement = self.client.post("/api/requirements", json={"buyer": "Test buyer", "produce": "tamatar", "quantity": 10, "max_price": 100}).json()
        pairs = self.client.get("/api/matches").json()
        self.assertTrue(any(pair["product"]["id"] == product["id"] and pair["requirement"]["id"] == requirement["id"] for pair in pairs))


if __name__ == "__main__":
    unittest.main()
