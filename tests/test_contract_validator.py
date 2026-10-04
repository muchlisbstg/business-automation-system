import json
import tempfile
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator

from scripts.validate_contracts import check_schema
from scripts.validate_schema_fixtures import semantic_fixture_errors, validator_for_schema


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

    def test_wf05_accepts_a_mapped_node_declared_by_the_design_reference(self):
        schema_path = (
            Path(__file__).resolve().parents[1]
            / "workflows/WF-05-figma-handoff/schema.json"
        )
        instance = {
            "design_reference": {"node_ids": ["42:17"]},
            "task_mappings": [{"design_node_ids": ["42:17"]}],
        }

        self.assertEqual(semantic_fixture_errors(schema_path, instance), [])

    def test_wf05_rejects_a_mapped_node_absent_from_the_design_reference(self):
        schema_path = (
            Path(__file__).resolve().parents[1]
            / "workflows/WF-05-figma-handoff/schema.json"
        )
        instance = {
            "design_reference": {"node_ids": ["42:17"]},
            "task_mappings": [{"design_node_ids": ["42:99"]}],
        }

        errors = semantic_fixture_errors(schema_path, instance)

        self.assertEqual(len(errors), 1)
        self.assertIn("42:99", errors[0])
        self.assertIn("design_reference.node_ids", errors[0])

    def test_wf06_rejects_preview_url_with_userinfo(self):
        root = Path(__file__).resolve().parents[1]
        schema = json.loads(
            (root / "workflows/WF-06-frontend-qa/schema.json").read_text(
                encoding="utf-8"
            )
        )
        instance = json.loads(
            (
                root
                / "workflows/WF-06-frontend-qa/examples/valid.json"
            ).read_text(encoding="utf-8")
        )
        instance["target"]["preview_url"] = (
            "https://user:pass@preview.example.test/build/qa-run-001"
        )

        errors = list(Draft202012Validator(schema).iter_errors(instance))

        self.assertTrue(
            any(
                list(error.absolute_path) == ["target", "preview_url"]
                for error in errors
            ),
            [error.message for error in errors],
        )

    def test_wf16_rejects_impossible_candidate_observed_at_values(self):
        root = Path(__file__).resolve().parents[1]
        schema = json.loads(
            (root / "workflows/WF-16-17-incidents/schema.json").read_text(
                encoding="utf-8"
            )
        )
        instance = json.loads(
            (
                root
                / "workflows/WF-16-17-incidents/examples/valid.json"
            ).read_text(encoding="utf-8")
        )
        validator = validator_for_schema(schema)

        for observed_at in (
            "2026-02-31T02:00:00Z",
            "2026-10-05T25:61:61Z",
            "2026-10-05T04:28:47+99:99",
            "2026-10-05T02:00:60Z",
        ):
            with self.subTest(observed_at=observed_at):
                instance["observed_at"] = observed_at
                errors = list(validator.iter_errors(instance))
                self.assertTrue(
                    any(list(error.absolute_path) == ["observed_at"] for error in errors),
                    [error.message for error in errors],
                )

    def test_wf18_rejects_impossible_candidate_observed_at_values(self):
        root = Path(__file__).resolve().parents[1]
        schema = json.loads(
            (root / "workflows/WF-18-technical-debt/schema.json").read_text(
                encoding="utf-8"
            )
        )
        instance = json.loads(
            (
                root
                / "workflows/WF-18-technical-debt/examples/valid.json"
            ).read_text(encoding="utf-8")
        )
        validator = validator_for_schema(schema)

        for observed_at in (
            "2026-02-31T02:00:00Z",
            "2026-10-05T25:61:61Z",
            "2026-10-05T04:28:47+99:99",
            "2026-10-05T02:00:60Z",
        ):
            with self.subTest(observed_at=observed_at):
                instance["observed_at"] = observed_at
                errors = list(validator.iter_errors(instance))
                self.assertTrue(
                    any(
                        list(error.absolute_path) == ["observed_at"]
                        for error in errors
                    ),
                    [error.message for error in errors],
                )

    def test_wf19_rejects_revision_with_trailing_line_terminator(self):
        root = Path(__file__).resolve().parents[1]
        schema = json.loads(
            (root / "workflows/WF-19-docs-as-code/schema.json").read_text(
                encoding="utf-8"
            )
        )
        instance = json.loads(
            (
                root
                / "workflows/WF-19-docs-as-code/examples/valid.json"
            ).read_text(encoding="utf-8")
        )
        validator = validator_for_schema(schema)

        for revision_length in (40, 64):
            with self.subTest(revision_length=revision_length):
                instance["source"]["revision"] = "a" * revision_length + "\n"
                errors = list(validator.iter_errors(instance))
                self.assertTrue(
                    any(
                        list(error.absolute_path) == ["source", "revision"]
                        for error in errors
                    ),
                    [error.message for error in errors],
                )


if __name__ == "__main__":
    unittest.main()
