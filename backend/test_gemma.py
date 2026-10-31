import io
import json
import os
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from backend import gemma


class GemmaTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"GEMMA_API_KEY": "test-only", "GEMMA_MODEL": "gemma-4-26b-a4b-it", "GEMMA_BASE_URL": gemma.BASE})
        self.env.start()
        self.addCleanup(self.env.stop)

    def test_missing_key(self):
        os.environ["GEMMA_API_KEY"] = ""
        self.assertEqual(gemma.status()["status"], "NOT_CONFIGURED")
        with self.assertRaises(gemma.AIError):
            gemma.generate("description", {"produce": "tomato"})

    def test_no_model_substitution(self):
        os.environ["GEMMA_MODEL"] = "gemini-test"
        self.assertEqual(gemma.status()["status"], "NOT_CONFIGURED")

    def test_no_key_sent_to_arbitrary_host(self):
        os.environ["GEMMA_BASE_URL"] = "https://example.org"
        self.assertEqual(gemma.status()["status"], "NOT_CONFIGURED")

    def test_requires_actual_data(self):
        for task in ("description", "forecast", "matching", "logistics"):
            with self.assertRaises(gemma.AIError):
                gemma.generate(task, {})

    @patch("backend.gemma.urlopen")
    def test_documented_request_and_response(self, request):
        request.return_value = io.BytesIO(json.dumps({"candidates": [{"content": {"parts": [{"text": "Test fixture", "thought": True}, {"text": "Actual provider text"}]}}]}).encode())
        result = gemma.generate("description", {"produce": "tomatoes"})
        self.assertEqual(result["text"], "Actual provider text")
        sent = request.call_args.args[0]
        self.assertIn("gemma-4-26b-a4b-it:generateContent", sent.full_url)
        self.assertNotIn("test-only", sent.full_url)
        self.assertIn("tomatoes", sent.data.decode())

    @patch("backend.gemma.urlopen", side_effect=URLError("private diagnostic"))
    def test_network_failure_no_fallback(self, request):
        with self.assertRaisesRegex(gemma.AIError, "unreachable"):
            gemma.generate("description", {"produce": "tomatoes"})

    @patch("backend.gemma.urlopen")
    def test_empty_response(self, request):
        request.return_value = io.BytesIO(b'{"candidates": []}')
        with self.assertRaisesRegex(gemma.AIError, "no usable text"):
            gemma.generate("description", {"produce": "tomatoes"})

    def test_invalid_photo(self):
        with self.assertRaises(gemma.AIError):
            gemma.generate("photo", {}, "invalid", "image/png")


if __name__ == "__main__":
    unittest.main()
