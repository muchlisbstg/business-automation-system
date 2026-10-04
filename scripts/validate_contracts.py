#!/usr/bin/env python3
import json
from pathlib import Path

from jsonschema import Draft202012Validator
from jsonschema.exceptions import SchemaError

ROOT = Path(__file__).resolve().parents[1]


def load_json(path, errors):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{path}: invalid JSON: {exc}")
        return None


def check_schema(path, errors):
    data = load_json(path, errors)
    if data is None:
        return
    if data.get("$schema") != "https://json-schema.org/draft/2020-12/schema":
        errors.append(f"{path}: expected JSON Schema draft 2020-12")
    if data.get("type") != "object":
        errors.append(f"{path}: root type must be object")
    if data.get("additionalProperties") is not False:
        errors.append(f"{path}: additionalProperties must be false")
    try:
        Draft202012Validator.check_schema(data)
    except SchemaError as exc:
        errors.append(f"{path}: invalid JSON Schema: {exc.message}")


def check_example(path, errors):
    data = load_json(path, errors)
    if data is None:
        return
    if not isinstance(data, dict):
        errors.append(f"{path}: fixture root must be an object")


def check_schema_mirror(reference_path, mirror_path, errors):
    reference = load_json(reference_path, errors)
    mirror = load_json(mirror_path, errors)
    if reference is None or mirror is None:
        return

    identity_metadata = {"$id", "title"}
    reference_contract = {
        key: value for key, value in reference.items() if key not in identity_metadata
    }
    mirror_contract = {
        key: value for key, value in mirror.items() if key not in identity_metadata
    }
    if reference_contract != mirror_contract:
        errors.append(
            f"{mirror_path}: schema contract must mirror {reference_path} "
            "except for $id and title metadata"
        )


def main():
    errors = []
    schemas = sorted(ROOT.glob("workflows/*/schema.json"))
    fixtures = sorted(ROOT.glob("workflows/*/examples/*.json"))
    schema_mirrors = [
        (
            ROOT / "workflows/WF-03-orchestration/schema.json",
            ROOT / "workflows/WF-02-03-review-signal/schema.json",
        )
    ]

    if not schemas:
        errors.append("No workflow schemas found")
    if not fixtures:
        errors.append("No workflow fixtures found")

    for path in schemas:
        check_schema(path, errors)
    for path in fixtures:
        check_example(path, errors)
    for reference_path, mirror_path in schema_mirrors:
        check_schema_mirror(reference_path, mirror_path, errors)

    if errors:
        print("Contract validation failed:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print(f"Contract validation passed: {len(schemas)} schema(s), {len(fixtures)} fixture(s).")


if __name__ == "__main__":
    main()
