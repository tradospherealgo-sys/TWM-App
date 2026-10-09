# Signals / AI Team

Trace:
Market data → indicators/features → strategy/logic → AI agents → review/consensus → risk checks → signal record → UI.

A signal should expose, where applicable:
- instrument
- BUY/SELL/HOLD
- timestamp
- timeframe
- entry/reference
- target
- stop loss
- confidence
- rationale
- status
- strategy/model
- data freshness

If six agents exist, identify each role, inputs, outputs, disagreement handling and final decision logic.

An LLM-generated paragraph is not automatically a real trading signal.

Classify the system:
REAL / PARTIAL / DEMO / NON-FUNCTIONAL.

Flag guaranteed-return language and unsupported certainty.
