#!/usr/bin/env python3
"""Export a Codex rollout into the openvela contest JSONL schema."""

from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator


SCHEMA_VERSION = "1.0"
IMAGE_BLOCK_TYPES = {"image", "input_image", "output_image"}
SECRET_RULES = (
    (re.compile(r"sk-[A-Za-z0-9_-]{20,}"), "sk-***REDACTED***"),
    (re.compile(r"ghp_[A-Za-z0-9]{36}"), "ghp_***REDACTED***"),
    (re.compile(r"Bearer\s+[A-Za-z0-9._\-+/=]+"), "Bearer ***REDACTED***"),
)
DATA_URL = re.compile(r"data:[^,\s]+;base64,[A-Za-z0-9+/=_-]+")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def jsonl_line(value: Any) -> str:
    return (json.dumps(value, ensure_ascii=False, separators=(",", ":"))
            .replace("\u0085", "\\u0085")
            .replace("\u2028", "\\u2028")
            .replace("\u2029", "\\u2029"))


def iter_jsonl(path: Path) -> Iterator[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as source:
        for line in source:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(row, dict):
                yield row


def redact_value(value: Any, counter: list[int]) -> Any:
    if isinstance(value, str):
        result = value
        for pattern, replacement in SECRET_RULES:
            result, count = pattern.subn(replacement, result)
            counter[0] += count
        return result
    if isinstance(value, list):
        return [redact_value(item, counter) for item in value]
    if isinstance(value, dict):
        return {key: redact_value(item, counter) for key, item in value.items()}
    return value


def sanitize_value(value: Any) -> Any:
    if isinstance(value, list):
        cleaned = []
        for item in value:
            item_type = item.get("type") if isinstance(item, dict) else None
            if isinstance(item_type, str) and item_type in IMAGE_BLOCK_TYPES:
                continue
            cleaned.append(sanitize_value(item))
        return cleaned
    if isinstance(value, dict):
        block_type = value.get("type")
        if isinstance(block_type, str) and block_type in IMAGE_BLOCK_TYPES:
            return None
        return {
            key: ("<image omitted>" if key in {"image_url", "data"} and isinstance(item, str)
                  and item.startswith("data:") else sanitize_value(item))
            for key, item in value.items()
        }
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith(("{", "[")):
            try:
                return sanitize_value(json.loads(value))
            except json.JSONDecodeError:
                pass
        return DATA_URL.sub("<image omitted>", value)
    return value


def message_text(payload: dict[str, Any]) -> str:
    parts = []
    for block in payload.get("content") or []:
        if not isinstance(block, dict) or block.get("type") in IMAGE_BLOCK_TYPES:
            continue
        text = block.get("text")
        if isinstance(text, str) and text:
            parts.append(text)
    return "\n".join(parts)


def reasoning_text(payload: dict[str, Any]) -> str:
    parts = []
    for block in payload.get("summary") or []:
        if isinstance(block, dict) and isinstance(block.get("text"), str):
            parts.append(block["text"])
    return "\n".join(parts)


def convert_rows(
    rows: Iterable[dict[str, Any]],
    session_id: str,
    team_id: str,
    github_login: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    events: list[dict[str, Any]] = []
    model = ""
    raw_event_count = 0
    tokens_total = 0
    redacted_total = 0

    def append_event(timestamp: str, role: str, **fields: Any) -> None:
        nonlocal redacted_total
        event = {
            "schema_version": SCHEMA_VERSION,
            "session_id": session_id,
            "team_id": team_id,
            "github_login": github_login,
            "tool": "codex",
            "seq": len(events),
            "ts": timestamp or utc_now(),
            "role": role,
            **fields,
        }
        counter = [0]
        event = redact_value(event, counter)
        if counter[0]:
            event["redacted_count"] = counter[0]
            redacted_total += counter[0]
        events.append(event)

    for row in rows:
        raw_event_count += 1
        row_type = row.get("type")
        payload = row.get("payload") or {}
        if not isinstance(payload, dict):
            continue
        timestamp = row.get("timestamp") or utc_now()

        if row_type == "turn_context":
            if isinstance(payload.get("model"), str):
                model = payload["model"]
            continue

        if row_type == "token_usage_record":
            usage = payload.get("usage") or {}
            if not isinstance(usage, dict):
                continue
            tokens_in = usage.get("input_tokens")
            tokens_out = usage.get("output_tokens")
            total = usage.get("total_tokens")
            if isinstance(total, int):
                tokens_total += total
            fields: dict[str, Any] = {
                "text": "Token usage recorded for a Codex model response.",
                "metadata": {
                    "response_id": payload.get("response_id"),
                    "total_tokens": total,
                },
            }
            if isinstance(tokens_in, int):
                fields["tokens_in"] = tokens_in
            if isinstance(tokens_out, int):
                fields["tokens_out"] = tokens_out
            if model:
                fields["model"] = model
            append_event(timestamp, "system", **fields)
            continue

        if row_type != "response_item":
            continue

        item_type = payload.get("type")
        if item_type == "message":
            text = message_text(payload)
            if not text:
                continue
            source_role = payload.get("role")
            role = source_role if source_role in {"user", "assistant", "system"} else "system"
            fields = {"text": text}
            if role == "assistant" and model:
                fields["model"] = model
            if payload.get("phase"):
                fields["metadata"] = {"phase": payload["phase"]}
            append_event(timestamp, role, **fields)
            continue

        if item_type == "reasoning":
            thinking = reasoning_text(payload)
            if thinking:
                fields = {"thinking": thinking}
                if model:
                    fields["model"] = model
                append_event(timestamp, "assistant", **fields)
            continue

        if item_type in {"function_call", "custom_tool_call", "tool_search_call", "web_search_call"}:
            call_id = payload.get("call_id") or payload.get("id") or f"call-{len(events)}"
            tool_name = payload.get("name") or item_type.removesuffix("_call")
            raw_input = payload.get("arguments") if "arguments" in payload else payload.get("input")
            if raw_input is None and "action" in payload:
                raw_input = payload.get("action")
            append_event(
                timestamp,
                "tool",
                tool_name=str(tool_name),
                tool_call_id=str(call_id),
                input=sanitize_value(raw_input),
                output=None,
            )
            continue

        if item_type in {"function_call_output", "custom_tool_call_output", "tool_search_output"}:
            call_id = payload.get("call_id") or payload.get("id") or f"result-{len(events)}"
            append_event(
                timestamp,
                "tool",
                tool_name="<result>",
                tool_call_id=str(call_id),
                input=None,
                output=sanitize_value(payload.get("output", payload.get("tools"))),
            )

    stats = {
        "raw_event_count": raw_event_count,
        "tokens_total": tokens_total,
        "redacted_count_total": redacted_total,
        "model": model,
    }
    return events, stats


def write_export(
    source: Path,
    repo_root: Path,
    session_id: str,
    team_id: str,
    github_login: str,
) -> tuple[Path, Path, dict[str, Any]]:
    events, stats = convert_rows(iter_jsonl(source), session_id, team_id, github_login)
    if not events:
        raise RuntimeError("No supported Codex events were found in the source rollout")

    started_at = events[0]["ts"]
    last_event_at = events[-1]["ts"]
    date = started_at[:10]
    member_dir = repo_root / "logs" / github_login
    output = member_dir / date / f"codex__{session_id}.jsonl"
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="\n") as target:
        for event in events:
            target.write(jsonl_line(event) + "\n")

    manifest_path = member_dir / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        manifest = {"schema_version": SCHEMA_VERSION, "team_id": team_id,
                    "github_login": github_login, "sessions": []}

    entry = {
        "session_id": session_id,
        "tool": "codex",
        "started_at": started_at,
        "last_event_at": last_event_at,
        "event_count": len(events),
        "raw_event_count": stats["raw_event_count"],
        "file_path": f"logs/{github_login}/{date}/codex__{session_id}.jsonl",
        "collection_mode": "cli",
        "health": "ok",
        "tokens_total": stats["tokens_total"],
        "redacted_count_total": stats["redacted_count_total"],
    }
    if stats["model"]:
        entry["model"] = stats["model"]

    sessions = manifest.setdefault("sessions", [])
    existing = next((item for item in sessions if item.get("session_id") == session_id), None)
    if existing:
        existing.update(entry)
    else:
        sessions.append(entry)
    manifest.update({
        "schema_version": SCHEMA_VERSION,
        "team_id": team_id,
        "github_login": github_login,
        "generator": "contest-log-collector@1.3.0 + codex-converter@1.0.0",
        "updated_at": utc_now(),
    })
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return output, manifest_path, stats


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Codex rollout JSONL file")
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--session-id", required=True)
    parser.add_argument("--team-id", default=os.environ.get("TEAM_ID", ""))
    parser.add_argument("--github-login", default=os.environ.get("GITHUB_LOGIN", ""))
    args = parser.parse_args()
    if not args.team_id or not args.github_login:
        parser.error("--team-id and --github-login are required")

    output, manifest, stats = write_export(
        args.source.resolve(), args.repo_root.resolve(), args.session_id,
        args.team_id, args.github_login,
    )
    with output.open("r", encoding="utf-8") as exported:
        event_count = sum(1 for line in exported if line.strip())
    print(json.dumps({
        "output": str(output),
        "manifest": str(manifest),
        "events": event_count,
        **stats,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
