import copy
import json
import unittest
from pathlib import Path

from scripts.validate_schema_fixtures import validator_for_schema


class WF24ContractTests(unittest.TestCase):
    TEXT_PATHS = (
        ("request_id",),
        ("candidate_id",),
        ("source",),
        ("period_label",),
        ("metrics", 0, "metric_key"),
        ("metrics", 0, "unit"),
    )

    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        schema_path = root / "workflows/WF-24-engineering-metrics/schema.json"
        fixture_path = (
            root / "workflows/WF-24-engineering-metrics/examples/valid.json"
        )
        cls.validator = validator_for_schema(
            json.loads(schema_path.read_text(encoding="utf-8"))
        )
        cls.valid_candidate = json.loads(
            fixture_path.read_text(encoding="utf-8")
        )

    def test_required_text_fields_reject_whitespace_only_without_normalizing(self):
        for path in self.TEXT_PATHS:
            label = ".".join(map(str, path))
            with self.subTest(field=label):
                candidate = copy.deepcopy(self.valid_candidate)
                parent = candidate
                for part in path[:-1]:
                    parent = parent[part]
                field = path[-1]
                parent[field] = " \t\n"

                errors = list(self.validator.iter_errors(candidate))

                self.assertTrue(
                    any(
                        tuple(error.absolute_path) == path
                        and error.validator == "pattern"
                        for error in errors
                    ),
                    [error.message for error in errors],
                )

                parent[field] = " \tcontent \n"
                self.assertEqual(list(self.validator.iter_errors(candidate)), [])


if __name__ == "__main__":
    unittest.main()
