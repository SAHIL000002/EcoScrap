# MVP SCREEN INVENTORY

Total Screens: 12

Single Source of Truth: Stitch Design (stitch_kabadiwala_connect_ui_design/stitch_kabadiwala_connect_ui_design/)

---

## Screen 01
- **Name:** Splash Screen (splash_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/splash_screen
- **Purpose:** Brand landing, trust anchor, value proposition (कबाड़ से Recycling तक: सही दाम, सही Recycler, सुरक्षित Recycling).
- **Route / Key:** SPLASH
- **Primary User:** Informal Scrap Collector (कबाड़ीवाला), Recycler
- **Main Actions:** Auto-transition / tap to enter Language Selection, brand recognition, CPCB authorized chain messaging.

## Screen 02
- **Name:** Language Selection Screen (language_selection_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/language_selection_screen
- **Purpose:** Onboarding Step 1 - Select preferred regional language for accessibility and low-literacy ergonomics.
- **Route / Key:** LANGUAGE_SELECTION
- **Primary User:** Informal Scrap Collector
- **Main Actions:** Choose between Hindi (हिंदी), Marathi (मराठी), and English; audio guidance (सुनें); proceed to Login (आगे बढ़ें).

## Screen 03
- **Name:** Login & 1-Tap Demo Screen (login_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/login_screen
- **Purpose:** Mobile number login with OTP flow and 1-Tap Demo Collector persona bypass for instant evaluation.
- **Route / Key:** LOGIN
- **Primary User:** Informal Scrap Collector
- **Main Actions:** Enter phone number, request OTP, toggle language, 1-tap demo collector login (रमेश - कबाड़ संग्रहकर्ता).

## Screen 04
- **Name:** Home Dashboard (home_dashboard)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/home_dashboard
- **Purpose:** Primary collector operating hub displaying live sync state, quick action to sell scrap, todays mandi benchmark prices, earnings summary, and nearby authorized recyclers.
- **Route / Key:** DASHBOARD
- **Primary User:** Informal Scrap Collector
- **Main Actions:** Tap कबाड़ बेचें (Sell Scrap), view live market rates per KG, inspect quick earnings, tap nearby recyclers, access audio read-out.

## Screen 05
- **Name:** Material Selection Screen (material_selection_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/material_selection_screen
- **Purpose:** Step 1 of Lot Creation - High-visual grid of standardized e-waste and scrap categories with icon badges.
- **Route / Key:** MATERIAL_SELECTION
- **Primary User:** Informal Scrap Collector
- **Main Actions:** Select material category (PCB, Cable, Battery, CRT TV, LCD Panel, Motor, Magnet, Plastic, Other), audio guidance, proceed to Material Details.

## Screen 06
- **Name:** Material Details & Photo Upload Screen (material_details_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/material_details_screen
- **Purpose:** Step 2 of Lot Creation - Capture scrap photos, enter approximate weight (KG), and choose material condition/grade.
- **Route / Key:** MATERIAL_DETAILS
- **Primary User:** Informal Scrap Collector
- **Main Actions:** Camera/gallery photo capture, quick weight presets (+1, +5, +10 KG), condition selection (Good, Used, Damaged, Mixed), proceed to Price Estimate.

## Screen 07
- **Name:** Price Estimate Screen (price_estimate_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/price_estimate_screen
- **Purpose:** Step 3 of Lot Creation - Real-time valuation breakdown showing fair benchmark formula (Weight x Rate), min-max market spread, and 7-day price trends.
- **Route / Key:** PRICE_ESTIMATE
- **Primary User:** Informal Scrap Collector
- **Main Actions:** Review calculated fair price, save as draft, tap Recycler खोजें to discover authorized buyers and publish lot.

## Screen 08
- **Name:** Nearby Recycler Discovery List (nearby_recycler_list_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/nearby_recycler_list_screen
- **Purpose:** Geo-matched list of CPCB/MPCB authorized recyclers with distance, offered rates, pickup badges, and match scores.
- **Route / Key:** NEARBY_RECYCLERS
- **Primary User:** Informal Scrap Collector
- **Main Actions:** Filter by Nearest / Highest Price / Pickup Available, inspect facility credentials, request quotes / select buyer.

## Screen 09
- **Name:** Lot Details & Recycler Quote Screen (lot_details_recycler_quote_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/lot_details_recycler_quote_screen
- **Purpose:** Complete lot breakdown (KC-2026-XXXXXX) with recycler bid inspection, price comparison against benchmark, and quote acceptance/rejection.
- **Route / Key:** LOT_DETAILS_QUOTE
- **Primary User:** Informal Scrap Collector & Recycler
- **Main Actions:** Inspect lot photos, compare recycler offer with market price, accept quote (Offer स्वीकार करें), reject/counter, copy lot ID.

## Screen 10
- **Name:** My Lots Screen (my_lots_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/my_lots_screen
- **Purpose:** Portfolio view of all collector scrap lots grouped by status with offline indicator.
- **Route / Key:** MY_LOTS
- **Primary User:** Informal Scrap Collector
- **Main Actions:** Filter tabs (All, Pending, Accepted, Completed), view lot cards with live status badges, tap lot to view details or trigger handover.

## Screen 11
- **Name:** Earnings & Transactions Ledger (earnings_transactions_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/earnings_transactions_screen
- **Purpose:** Comprehensive financial dashboard showing total earnings, paid vs pending balances, monthly trend graph, and transaction history.
- **Route / Key:** EARNINGS_TRANSACTIONS
- **Primary User:** Informal Scrap Collector
- **Main Actions:** Filter by All / Cash / UPI, view transaction cards with payment status chips, inspect payout details, call recycler for pending dues.

## Screen 12
- **Name:** Handover & Digital Receipt Screen (handover_digital_receipt_screen)
- **Stitch Folder:** stitch_kabadiwala_connect_ui_design/handover_digital_receipt_screen
- **Purpose:** Formalization milestone - Tamper-evident digital proof of handover with reference (KCH-2026-XXXXXX), verified weight, payment confirmation, and CPCB compliance certification.
- **Route / Key:** HANDOVER_RECEIPT
- **Primary User:** Informal Scrap Collector & Recycler
- **Main Actions:** View verified handover certificate, copy Handover Reference, share/download receipt, return to Home.

---

## Scope Rules

- MVP contains exactly 12 screens.
- Stitch designs are the UI source of truth.
- No additional screens without explicit approval.
- Existing approved screens must not be redesigned.
- All auxiliary flows (audio guidance, safety advisories, offline sync banners) are embedded within these 12 screens.