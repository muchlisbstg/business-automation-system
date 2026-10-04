import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_contracts import check_schema


class ContractValidatorTests(unittest.TestCase):
    def test_rejects_invalid_keyword_value_not_exercised_by_fixtures(self):
        schema = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "optional": {"type": "string", "maxLength": "not-an-integer"}
            },
        }
        with tempfile.TemporaryDirectory() as temporary_directory:
            schema_path = Path(temporary_directory) / "schema.json"
            schema_path.write_text(json.dumps(schema), encoding="utf-8")
            errors = []

            check_schema(schema_path, errors)

        self.assertTrue(
            any("invalid JSON Schema" in error for error in errors),
            errors,
        )

    def test_accepts_a_schema_valid_under_draft_2020_12(self):
        schema = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object",
            "additionalProperties": False,
            "properties": {"optional": {"type": "string", "maxLength": 8}},
        }
        with tempfile.TemporaryDirectory() as temporary_directory:
            schema_path = Path(temporary_directory) / "schema.json"
            schema_path.write_text(json.dumps(schema), encoding="utf-8")
            errors = []

            check_schema(schema_path, errors)

        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
