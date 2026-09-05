---
name: health-aware-watch-planning
description: Use when converting a short daily goal and wearable vitals into a safe, compact one-day plan for an openvela watch or similar constrained display.
---

# Health-Aware Watch Planning

Turn a natural-language goal into an executable watch plan. The plan is a scheduling aid, not a diagnosis or treatment recommendation.

## Input Contract

- `category`: `daily`, `study`, `fitness`, or `mixed`.
- `goal`: the user's original text, including available time when stated.
- `vitals`: numeric `heartRate`, `spo2`, and `stress`; missing values use conservative defaults and must not be presented as measured facts.

## Output Contract

Return one JSON object with:

```json
{
  "title": "string",
  "category": "daily|study|fitness|mixed",
  "summary": "string",
  "riskLevel": "normal|caution",
  "vitals": {"heartRate": 0, "spo2": 0, "stress": 0},
  "tasks": [{"time": "HH:mm", "type": "string", "name": "string", "duration": 15, "tip": "string"}],
  "reviewQuestion": "string",
  "nextAdvice": "string"
}
```

Every task needs a valid `HH:mm` time, a non-empty name, a positive integer duration, and a short tip. Do not add prose outside the JSON object. Validate the object before rendering it; if validation fails, use the deterministic local planner.

## Decision Rules

1. Normalize numeric vitals and retain the actual values in the JSON.
2. Set `riskLevel` to `caution` when `stress >= 40`, `heartRate >= 110`, or `spo2 < 95`.
3. For caution, add recovery time. Avoid vigorous exercise; use mobility, easy walking, or rest. Never state a diagnosis or claim that a value proves illness.
4. Respect the requested category and available time. For `mixed`, interleave the highest-priority work, a break, and optional light activity.
5. Keep the task list short enough to scan on a watch and make the next action obvious.

## Fallback

Generate the local rule-based plan before calling an AI service. If the service is unavailable, times out, returns invalid JSON, or omits required fields, keep the local plan and expose a plain status such as `AI unavailable; local plan kept`.

## Common Mistakes

- Returning a conversational answer instead of the required JSON.
- Using relative times such as `this afternoon` in a watch task.
- Treating mock or missing vitals as a medical measurement.
- Scheduling high-intensity exercise when a caution flag is present.
- Rendering an unchecked AI response directly into the page.
