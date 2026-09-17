import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[2] / "tools" / "export_codex_contest_log.py"
SPEC = importlib.util.spec_from_file_location("export_codex_contest_log", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ExportCodexLogTest(unittest.TestCase):
    def test_write_export_keeps_unicode_line_separators_inside_one_jsonl_line(self):
        row = {
            "timestamp": "2026-09-17T10:00:00Z",
            "type": "response_item",
            "payload": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": "first\u2028second"}],
            },
        }
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / "rollout.jsonl"
            source.write_text(json.dumps(row) + "\n", encoding="utf-8")
            output, _, _ = MODULE.write_export(
                source,
                Path(temp),
                "session-1",
                "contest2026_107_VoicePlan",
                "Yjwqj",
            )
            lines = output.read_text(encoding="utf-8").splitlines()

        self.assertEqual(len(lines), 1)
        self.assertEqual(json.loads(lines[0])["text"], "first\u2028second")

    def test_sanitize_value_accepts_non_string_type_fields(self):
        value = {"type": ["text", "null"], "payload": {"type": "object"}}

        self.assertEqual(MODULE.sanitize_value(value), value)

    def test_converts_codex_events_and_removes_image_payloads(self):
        fake_key = "sk-" + "1" * 30
        rows = [
            {
                "timestamp": "2026-09-17T10:00:00Z",
                "type": "session_meta",
                "payload": {"id": "session-1"},
            },
            {
                "timestamp": "2026-09-17T10:00:01Z",
                "type": "turn_context",
                "payload": {"model": "gpt-test"},
            },
            {
                "timestamp": "2026-09-17T10:00:02Z",
                "type": "response_item",
                "payload": {
                    "type": "message",
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": "build the app"},
                        {"type": "input_image", "image_url": "data:image/png;base64,AAAA"},
                    ],
                },
            },
            {
                "timestamp": "2026-09-17T10:00:03Z",
                "type": "response_item",
                "payload": {
                    "type": "reasoning",
                    "summary": [{"type": "summary_text", "text": "Inspect the repository."}],
                },
            },
            {
                "timestamp": "2026-09-17T10:00:04Z",
                "type": "response_item",
                "payload": {
                    "type": "custom_tool_call",
                    "name": "exec",
                    "call_id": "call-1",
                    "input": "use " + fake_key,
                },
            },
            {
                "timestamp": "2026-09-17T10:00:05Z",
                "type": "response_item",
                "payload": {
                    "type": "custom_tool_call_output",
                    "call_id": "call-1",
                    "output": [
                        {"type": "input_text", "text": "Script completed"},
                        {"type": "input_image", "image_url": "data:image/png;base64,BBBB"},
                    ],
                },
            },
            {
                "timestamp": "2026-09-17T10:00:06Z",
                "type": "token_usage_record",
                "payload": {
                    "response_id": "response-1",
                    "usage": {"input_tokens": 100, "output_tokens": 20, "total_tokens": 120},
                },
            },
            {
                "timestamp": "2026-09-17T10:00:07Z",
                "type": "response_item",
                "payload": {
                    "type": "message",
                    "role": "assistant",
                    "phase": "final_answer",
                    "content": [{"type": "output_text", "text": "Done."}],
                },
            },
        ]

        events, stats = MODULE.convert_rows(
            rows,
            session_id="session-1",
            team_id="contest2026_107_VoicePlan",
            github_login="Yjwqj",
        )

        self.assertEqual([event["seq"] for event in events], list(range(len(events))))
        self.assertEqual([event["role"] for event in events], [
            "user", "assistant", "tool", "tool", "system", "assistant"
        ])
        self.assertEqual(events[0]["text"], "build the app")
        self.assertEqual(events[1]["thinking"], "Inspect the repository.")
        self.assertEqual(events[2]["tool_name"], "exec")
        self.assertIn("sk-***REDACTED***", events[2]["input"])
        self.assertEqual(events[3]["output"], [{"type": "input_text", "text": "Script completed"}])
        self.assertEqual(events[4]["tokens_in"], 100)
        self.assertEqual(events[4]["tokens_out"], 20)
        self.assertEqual(events[5]["model"], "gpt-test")
        self.assertEqual(stats["tokens_total"], 120)
        self.assertEqual(stats["redacted_count_total"], 1)
        self.assertNotIn("base64", json.dumps(events))


if __name__ == "__main__":
    unittest.main()
