import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WF03_README = ROOT / "workflows" / "WF-03-orchestration" / "README.md"


class Wf03DocumentationContractTests(unittest.TestCase):
    def test_wf03_consumes_a_planned_wf02_result_with_review_signal(self):
        purpose = WF03_README.read_text(encoding="utf-8").split("## Input", 1)[0]

        self.assertIn("PLANNED WF-02 planning result", purpose)
        self.assertIn("`review_signal`", purpose)
        self.assertNotIn("approved planning record", purpose.lower())


if __name__ == "__main__":
    unittest.main()
