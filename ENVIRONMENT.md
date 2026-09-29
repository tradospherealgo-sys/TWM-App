# Environment Configuration Reference

All environment variables used by TWM are documented in `.env.example`.

## ⚙️ Configuration Variables

| Variable | Required | Default in Dev | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `file:./dev.db` | SQLite database URI for local dev, PostgreSQL URI in production. |
| `JWT_SECRET` | **Yes** | `twm_development_session...` | 32+ character key used to cryptographically sign session JWTs. |
| `NEXT_PUBLIC_APP_NAME` | No | `Tradosphere Wealth Management` | Application display name. |
| `NEXT_PUBLIC_APP_SHORT_NAME` | No | `TWM` | Short header branding mark. |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Base public URL. |
| `SMC_GLOBAL_AP_CODE` | Optional | `""` | Authorised Person code issued by SMC Global. |
| `SMC_GLOBAL_API_KEY` | Optional | `""` | SMC Gateway API Key. |
| `SMC_GLOBAL_API_SECRET` | Optional | `""` | SMC Gateway API Secret. |
| `SMC_GLOBAL_ONBOARDING_URL` | Optional | `https://www.smcindiaonline.com` | Official URL for online Demat onboarding. |
| `SMC_GLOBAL_TRADING_PORTAL_URL`| Optional | `https://smctradeonline.com` | Official SMC Ace web terminal URL. |
| `MARKET_DATA_PROVIDER_API_KEY` | Optional | `""` | API key for live NSE/BSE tick feeds. When empty, TWM reports `DATA_UNAVAILABLE`. |
| `AI_PROVIDER_API_KEY` | Optional | `""` | External LLM API key. When empty, TWM uses built-in compliant heuristic retrieval. |
| `STORAGE_DRIVER` | Optional | `local` | `local` \| `s3` \| `gcs`. |

---

## 🔒 Security Best Practices

1. Never commit `.env` or `.env.local` to Git. (Enforced in `.gitignore`).
2. Production `JWT_SECRET` must be generated with high entropy:
   ```bash
   openssl rand -base64 32
   ```
3. Never log secret values or unmasked PAN/Aadhaar in application logs.
