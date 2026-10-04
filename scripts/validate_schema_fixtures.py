#!/usr/bin/env python3
"""Check positive, schema-invalid, and selected semantic-negative fixtures.

Schema-negative fixtures use the ``schema-invalid-*.json`` filename pattern.
Semantic-negative fixtures use ``semantic-invalid-*.json`` and must first pass
JSON Schema validation. The WF-05 semantic rule checked here is only that every
task mapping's design node IDs appear in the event's declared design node IDs;
source-chain and plan-membership checks require source records and remain outside
this fixture validator.
"""

import json
from datetime import datetime
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker
ROOT = Path(__file__).resolve().parents[1]
WF05_DIRECTORY = "WF-05-figma-handoff"


DATE_TIME_FORMAT_CHECKER = FormatChecker()


@DATE_TIME_FORMAT_CHECKER.checks("date-time")
def is_candidate_date_time(value):
    """Assert calendar/time validity for the repository's strict date-time profile.

    The schema's pattern constrains the accepted spelling. Python's ISO parser
    then rejects impossible dates, clock fields, offsets, and leap seconds.
    """
    if not isinstance(value, str):
        return True
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        datetime.fromisoformat(normalized)
    except ValueError:
        return False
    return True


def validator_for_schema(schema):
    return Draft202012Validator(schema, format_checker=DATE_TIME_FORMAT_CHECKER)


def fixture_errors(validator, fixture_path):
    instance = json.loads(fixture_path.read_text(encoding="utf-8"))
    return sorted(
        validator.iter_errors(instance),
        key=lambda error: (list(map(str, error.absolute_path)), error.message),
    )


def semantic_fixture_errors(schema_path, instance):
    """Return deterministic cross-field errors covered by proposal fixtures."""
    if schema_path.parent.name != WF05_DIRECTORY:
        return []

    declared_node_ids = set(instance["design_reference"]["node_ids"])
    errors = []
    for mapping_index, mapping in enumerate(instance["task_mappings"]):
        for node_id in mapping["design_node_ids"]:
            if node_id not in declared_node_ids:
                errors.append(
                    f"task_mappings[{mapping_index}].design_node_ids references "
                    f"{node_id!r}, which is absent from "
                    "design_reference.node_ids"
                )
    return errors


def main():
    schema_paths = sorted(ROOT.glob("workflows/*/schema.json"))
    failures = []
    positive_count = 0
    negative_count = 0
    semantic_negative_count = 0

    if not schema_paths:
        failures.append("No workflow schemas found")

    for schema_path in schema_paths:
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        validator = validator_for_schema(schema)
        positive_fixtures = sorted(schema_path.parent.glob("examples/valid*.json"))
        negative_fixtures = sorted(
            schema_path.parent.glob("examples/schema-invalid-*.json")
        )
        semantic_negative_fixtures = sorted(
            schema_path.parent.glob("examples/semantic-invalid-*.json")
        )

        if not positive_fixtures:
            failures.append(f"{schema_path}: missing examples/valid*.json")
        if not negative_fixtures:
            failures.append(f"{schema_path}: missing examples/schema-invalid-*.json")
        if (
            schema_path.parent.name == WF05_DIRECTORY
            and not semantic_negative_fixtures
        ):
            failures.append(
                f"{schema_path}: missing WF-05 semantic-invalid fixture"
            )

        for fixture_path in positive_fixtures:
            instance = json.loads(fixture_path.read_text(encoding="utf-8"))
            errors = list(validator.iter_errors(instance))
            if errors:
                for error in errors:
                    failures.append(
                        f"{fixture_path}: unexpected schema error: {error.message}"
                    )
            else:
                semantic_errors = semantic_fixture_errors(schema_path, instance)
                if semantic_errors:
                    for error in semantic_errors:
                        failures.append(
                            f"{fixture_path}: unexpected semantic error: {error}"
                        )
                else:
                    positive_count += 1
                    print(f"OK {fixture_path} matches {schema_path}")

        for fixture_path in negative_fixtures:
            errors = fixture_errors(validator, fixture_path)
            if not errors:
                failures.append(
                    f"{fixture_path}: expected rejection by {schema_path}, "
                    "but it was accepted"
                )
            else:
                negative_count += 1
                print(f"OK {fixture_path} is rejected by {schema_path}")

        for fixture_path in semantic_negative_fixtures:
            instance = json.loads(fixture_path.read_text(encoding="utf-8"))
            schema_errors = list(validator.iter_errors(instance))
            if schema_errors:
                for error in schema_errors:
                    failures.append(
                        f"{fixture_path}: semantic-negative fixture must be "
                        f"schema-valid: {error.message}"
                    )
                continue
            semantic_errors = semantic_fixture_errors(schema_path, instance)
            if not semantic_errors:
                failures.append(
                    f"{fixture_path}: expected a semantic rejection, "
                    "but the fixture satisfies the checked semantic rules"
                )
            else:
                semantic_negative_count += 1
                print(
                    f"OK {fixture_path} passes schema validation and fails "
                    "the checked semantic rule"
                )

    if failures:
        print("Schema fixture validation failed:")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print(
        "Contract fixture validation passed: "
        f"{len(schema_paths)} schema(s), {positive_count} positive fixture(s), "
        f"{negative_count} schema-invalid fixture(s), "
        f"{semantic_negative_count} semantic-negative fixture(s)."
    )


if __name__ == "__main__":
    main()
