import json
import unittest
from pathlib import Path

from scripts.validate_schema_fixtures import validator_for_schema


class WF23ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        schema_path = root / "workflows/WF-23-learning/schema.json"
        fixture_path = root / "workflows/WF-23-learning/examples/valid.json"
        cls.validator = validator_for_schema(
            json.loads(schema_path.read_text(encoding="utf-8"))
        )
        cls.valid_candidate = json.loads(fixture_path.read_text(encoding="utf-8"))

    def test_required_text_fields_reject_whitespace_only_without_normalizing(self):
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

                candidate[field] = " \tcontent \n"
                self.assertEqual(list(self.validator.iter_errors(candidate)), [])


if __name__ == "__main__":
    unittest.main()
