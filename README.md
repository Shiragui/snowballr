# SnowballR 📈

A clean, accessible ETF research and growth simulation Frontend UI Demo.

🚀 **Live Site:** [https://snowballr.netlify.app](https://snowballr.netlify.app)

## Features

- **ETF Search**: Quick search for popular ETFs (VOO, SPY, QQQ, etc.)
- **ETF Details**: View key metrics like expense ratio, returns, volatility, and dividend yield
- **Growth Simulator**: Calculate potential investment growth over time with monthly contributions
- **Interactive Charts**: Visualize investment projections with real stock data
- **Real Stock Data**: Live stock prices and historical data via Alpha Vantage API

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **lightweight-charts** - Chart visualizations
- **Yahoo Finance** (via proxy) - Stock market data
- **Express API** - Google login, saved projections, Schwab OAuth

## Local development

```bash
npm install
cp .env.example .env   # fill in credentials (see below)
npm run dev:all        # frontend :5173 + API :3001
```

Or run separately: `npm run dev:api` and `npm run dev`.

## Sign in & saved projections

1. Create [Google OAuth credentials](https://console.cloud.google.com/apis/credentials) (Web application).
2. Set **Authorized redirect URI** to `http://localhost:3001/api/auth/google/callback`.
3. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `JWT_SECRET` to `.env`.
4. Open the app → **Sign in** → **Continue with Google**.
5. In Projection mode, use your account menu → **Save current projection**. Load saved projections from the same menu.

## Connect Charles Schwab (optional)

Schwab requires a separate [developer account](https://developer.schwab.com) and app approval (often 1–3 days).

1. Create an app at [developer.schwab.com/dashboard/apps](https://developer.schwab.com/dashboard/apps).
2. Enable **Accounts and Trading Production** (and optionally Market Data).
3. Set callback URL to `http://localhost:3001/api/schwab/callback` (must match exactly).
4. Add `SCHWAB_CLIENT_ID`, `SCHWAB_CLIENT_SECRET`, and `SCHWAB_REDIRECT_URI` to `.env`.
5. Sign in to SnowballR → account menu → **Connect Schwab account**.
6. After linking, your Schwab holdings appear at the bottom of the dashboard; click a symbol to load it.

**Note:** Schwab refresh tokens expire after 7 days — users must reconnect periodically. OAuth secrets must stay on the server (never in the frontend).

## Usage

1. Search for an ETF by ticker symbol (e.g., VOO, SPY, QQQ)
2. View detailed information about the selected ETF
3. Switch between "Price" and "Projection" modes to see:
   - **Price**: Real historical stock price data (last 365 days)
   - **Projection**: Future growth projections based on your inputs
4. Use the Growth Simulator to project investment returns
5. Adjust initial investment, monthly contributions, and time horizon
6. Compare with other stocks or custom rates

## Future Improvements

- Deploy API backend for production auth (Netlify frontend + hosted API)
- Schwab token refresh UX before 7-day expiry
- Compare multiple ETFs side-by-side
- More detailed financial metrics






---

Built for accessible financial education 🎓