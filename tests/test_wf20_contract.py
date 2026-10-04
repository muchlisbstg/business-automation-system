import json
import unittest
from pathlib import Path

from scripts.validate_schema_fixtures import validator_for_schema


class WF20ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        schema_path = root / "workflows/WF-20-knowledge-base/schema.json"
        fixture_path = root / "workflows/WF-20-knowledge-base/examples/valid.json"
        cls.validator = validator_for_schema(
            json.loads(schema_path.read_text(encoding="utf-8"))
        )
        cls.valid_candidate = json.loads(fixture_path.read_text(encoding="utf-8"))

    def test_each_required_text_field_rejects_whitespace_only(self):
        for field in ("request_id", "candidate_id", "source", "title", "summary"):
            with self.subTest(field=field):
                candidate = dict(self.valid_candidate)
                candidate[field] = " \t\n"

                errors = list(self.validator.iter_errors(candidate))

                self.assertTrue(
                    any(
                        list(error.absolute_path) == [field]
                        and error.validator == "pattern"
                        for error in errors
                    ),
                    [error.message for error in errors],
                )


if __name__ == "__main__":
    unittest.main()
