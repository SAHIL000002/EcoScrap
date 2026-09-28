# MVP FEATURE TO SCREEN MAPPING

This document maps every core functional capability of the Kabadiwala Connect Collector MVP to one of the approved 12 Stitch screens.
Strict rule: No auxiliary screen is permitted. All capabilities reside in these 12 screens.

---

## Feature Mapping Table

| MVP Feature Requirement | Implementing Stitch Screen | UI Integration Method |
|---|---|---|
| Brand, Mission & Value Proposition | Screen 01: Splash Screen (splash_screen) | Hero branding, Trust badge, Auto/tap continue |
| Multi-language Selection (HI, MR, EN) | Screen 02: Language Selection (language_selection_screen) | Language chips, audio listen trigger, selection indicator |
| Collector Authentication & Phone Login | Screen 03: Login Screen (login_screen) | Phone input, OTP verification flow |
| 1-Tap Demo Collector Access | Screen 03: Login Screen (login_screen) | Instant persona bypass card ("Ramesh - Scrap Collector") |
| Real-time Mandi Benchmark Price Display | Screen 04: Home Dashboard (home_dashboard) | Horizontal ticker & category benchmark rate cards |
| Quick Earnings & Payout Summary | Screen 04: Home Dashboard (home_dashboard) | Metric counter card (Total, Pending, Completed) |
| Audio Assistance (Voice Readout) | Embedded in Screens 02, 04, 05, 06 | Floating or in-header volume_up listen triggers |
| Offline Sync Status & Connectivity Indicator | Embedded in Screens 04, 10 | Status chip ("Online / Synced" / "Offline Mode") |
| Scrap Category Selection (E-Waste & Scrap) | Screen 05: Material Selection (material_selection_screen) | 9-item grid (PCB, Cable, Battery, CRT, LCD, etc.) |
| Scrap Photography (Camera / Gallery Upload) | Screen 06: Material Details (material_details_screen) | Camera modal / image preview card & retake trigger |
| Weight Entry & Unit Presets | Screen 06: Material Details (material_details_screen) | Numeric input + quick chips (+1, +5, +10 KG) |
| Material Grading & Condition Selection | Screen 06: Material Details (material_details_screen) | Condition cards (Good, Used, Damaged, Mixed) |
| Fair Price Valuation Calculation | Screen 07: Price Estimate (price_estimate_screen) | Mathematical formula card (Weight x Benchmark Rate) |
| Min-Max Market Spread Display | Screen 07: Price Estimate (price_estimate_screen) | Range slider/bar (Low - Medium - High) |
| Mandi 7-Day Price Trend History | Screen 07: Price Estimate (price_estimate_screen) | Sparkline / 7-day rate history card |
| Save Lot as Offline Draft | Screen 07: Price Estimate (price_estimate_screen) | "Save Draft" action button |
| Geo-Matched Authorized Recycler Discovery | Screen 08: Nearby Recyclers (
earby_recycler_list_screen) | Scored cards with distance, price, pickup, CPCB badge |
| Recycler Filters (Nearest, Rate, Pickup) | Screen 08: Nearby Recyclers (
earby_recycler_list_screen) | Filter pills (All, Nearest, Best Rate, Pickup Available) |
| Lot Inspection & Identifier Generation | Screen 09: Lot Details & Quote (lot_details_recycler_quote_screen) | Human-readable KC-2026-XXXXXX lot header |
| Recycler Bid / Quote Review | Screen 09: Lot Details & Quote (lot_details_recycler_quote_screen) | Recycler offer card with validity & pickup badge |
| Accept / Reject Recycler Quote | Screen 09: Lot Details & Quote (lot_details_recycler_quote_screen) | "Accept Offer" action button & rejection link |
| Portfolio Scrap Lot Management | Screen 10: My Lots (my_lots_screen) | Tabbed view (All, Pending, Accepted, Completed) |
| Collector Earnings Ledger & Trend Graph | Screen 11: Earnings & Transactions (earnings_transactions_screen) | Total earned, received vs pending cards, trend chart |
| Payment Mode Filter (Cash / UPI) | Screen 11: Earnings & Transactions (earnings_transactions_screen) | Mode filters and transaction history items |
| Direct Recycler Phone Call for Dues | Screen 11: Earnings & Transactions (earnings_transactions_screen) | Transaction item "Call" action button |
| Physical Handover Confirmation | Screen 12: Handover & Digital Receipt (handover_digital_receipt_screen) | Verified weight, recycler confirmation timestamp |
| Digital Handover Certificate Generation | Screen 12: Handover & Digital Receipt (handover_digital_receipt_screen) | Official receipt card with KCH-2026-XXXXXX reference |
| Share / Download Receipt Slip | Screen 12: Handover & Digital Receipt (handover_digital_receipt_screen) | "Share / Download Receipt" button |
| CPCB Formal Chain Environmental Impact | Screen 12: Handover & Digital Receipt (handover_digital_receipt_screen) | Environmental savings badge (e.g., 12.5 KG diverted) |

---

## Scope Lock Confirmation

All 29 core functional requirements of the Kabadiwala Connect mobile experience are mapped strictly to the 12 Stitch screens without any additional screens.