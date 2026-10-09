# Market Data / Real Platform Team

Trace:
Provider → API/server → database/cache → frontend.

For every market value identify:
- source
- endpoint
- authentication
- freshness/timestamp
- symbol mapping
- market/session handling
- error/fallback behavior
- whether it is live, cached, seeded or simulated

Check:
- live/current prices
- indices
- change/percentage
- market status
- instruments/search
- historical data
- charts
- refresh
- stale-data handling
- provider failure

Never use fake values to make a dashboard look populated.

Verdict whether the product honestly qualifies as:
LIVE MARKET PLATFORM / MARKET-INFORMATION DASHBOARD / SIMULATED DEMO / PARTIAL.
