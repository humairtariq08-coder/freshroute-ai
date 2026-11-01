from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from backend import main


class MarketplaceFlowTests(unittest.TestCase):
    def test_listing_requirement_match_reservation_forecast_and_logistics(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(main, "database_path", Path(folder) / "flow.db"), patch.dict("os.environ", {"DATABASE_URL": ""}):
            with TestClient(main.app) as client:
                product = client.post("/api/products", json={"name": "Fresh tomatoes", "farmer": "Flow Farm", "location": "Malir", "price": 90, "quantity": 25, "freshness_days": 2, "lat": 24.94, "lng": 67.2})
                self.assertEqual(product.status_code, 201)
                requirement = client.post("/api/requirements", json={"buyer": "Flow Buyer", "produce": "tamatar", "quantity": 10, "max_price": 110, "location": "Clifton", "lat": 24.81, "lng": 67.03})
                self.assertEqual(requirement.status_code, 201)
                pairs = client.get("/api/matches").json()
                self.assertTrue(any(pair["product"]["id"] == product.json()["id"] and pair["requirement"]["id"] == requirement.json()["id"] for pair in pairs))
                order = client.post("/api/orders", json={"product_id": product.json()["id"], "quantity": 10, "buyer": "Flow Buyer"})
                self.assertEqual(order.status_code, 201)
                snapshot = client.get("/api/marketplace").json()
                self.assertTrue(snapshot["summary"]["forecast"]["evaluated"])
                with patch("backend.routing._fetch_osrm_trip", return_value={"source": "osrm", "distance_km": 15.2, "duration_min": 31, "stop_order": [{"input_index": 0, "label": "Hub", "lat": 24.86, "lng": 67.01}, {"input_index": 1, "label": "Flow Buyer", "lat": 24.81, "lng": 67.03}], "geometry": [{"lat": 24.86, "lng": 67.01}, {"lat": 24.81, "lng": 67.03}], "note": "fixture"}):
                    route = client.post("/api/route/plan", json={"stops": [{"lat": 24.86, "lng": 67.01, "label": "Hub"}, {"lat": 24.81, "lng": 67.03, "label": "Flow Buyer"}]})
                self.assertEqual(route.status_code, 200)
                self.assertEqual(route.json()["source"], "osrm")


if __name__ == "__main__":
    unittest.main()
