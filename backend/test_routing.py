import io
import json
import unittest
from unittest import mock
from urllib.error import URLError

from backend import routing


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode()

    def __enter__(self):
        return io.BytesIO(self.payload)

    def __exit__(self, *args):
        return False


class RoutingTests(unittest.TestCase):
    def setUp(self):
        routing._cache.clear()

    def test_osrm_geometry_is_returned(self):
        payload = {"routes": [{
            "distance": 42100,
            "duration": 3600,
            "geometry": {"coordinates": [[67.0011, 24.8607], [67.05, 24.9], [67.1, 24.95]]},
        }]}
        with mock.patch.object(routing, "urlopen", return_value=FakeResponse(payload)):
            result = routing.route(24.8607, 67.0011, 24.95, 67.1)
        self.assertEqual(result["source"], "osrm")
        self.assertEqual(result["distance_km"], 42.1)
        self.assertEqual(result["duration_min"], 60)
        self.assertEqual(len(result["geometry"]), 3)
        self.assertEqual(result["geometry"][0], {"lat": 24.8607, "lng": 67.0011})

    def test_unreachable_osrm_falls_back_to_straight_line(self):
        with mock.patch.object(routing, "urlopen", side_effect=URLError("offline")):
            result = routing.route(24.8607, 67.0011, 25.032, 67.135)
        self.assertEqual(result["source"], "fallback")
        self.assertIsNone(result["duration_min"])
        self.assertEqual(len(result["geometry"]), 2)
        self.assertGreater(result["distance_km"], 0)

    def test_multistop_failure_returns_ordered_fallback(self):
        plan = routing.RoutePlan(stops=[routing.Stop(lat=24.86, lng=67.01, label="Hub"), routing.Stop(lat=25.03, lng=67.13, label="Buyer 1"), routing.Stop(lat=25.39, lng=68.37, label="Buyer 2")])
        with mock.patch.object(routing, "urlopen", side_effect=URLError("offline")):
            result = routing.route_plan(plan)
        self.assertEqual(result["source"], "fallback")
        self.assertEqual([stop["label"] for stop in result["stop_order"]], ["Hub", "Buyer 1", "Buyer 2"])
        self.assertIsNone(result["duration_min"])


if __name__ == "__main__":
    unittest.main()
