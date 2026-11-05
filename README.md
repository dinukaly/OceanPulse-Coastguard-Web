# OceanPulse Coastal Guard Emergency Command Center

Web-based command dashboard for the Sri Lanka Maritime Rescue Coordination Centre (MRCC) and Coastal Guard stations to monitor and coordinate emergency SOS distress alerts from offshore fishing vessels.

---

## Capabilities

* **Real-Time Surveillance Map:** Interactive OpenStreetMap marine radar showing distress beacon positions along coastal Sri Lanka with live pulsing pins (Active = Red, Acknowledged = Amber, Resolved = Green).
* **Urgent Distress Feed:** Chronological queue of distress calls with time elapsed and critical visual escalation for calls unacknowledged for $>5$ minutes.
* **Direct Vessel Communication:** Instant one-click phone dialer (`tel:`) to reach vessel masters directly, plus VHF Channel 16 (156.8 MHz) Mayday radio checklist.
* **Dispatch & Operations Management:** Acknowledge distress, record a dispatch after a unit has been sent, add operational notes, and resolve incidents.
* **Full Audit Trail:** Immutable chronological timeline of all events, notes, and responder actions per vessel.
* **Audio Distress Siren:** Integrated multi-tone maritime emergency siren synthesizer with browser-compliant user activation.

---

## Getting Started

### Prerequisites
* Node.js v18+
* OceanPulse backend API running on `http://127.0.0.1:3000`

### Installation & Run

```bash
cd OceanPulse-Coastguard-Web
npm install
npm run dev
```

The web dashboard starts at `http://localhost:5173`.

### Station Sign-In
Sign in with a provisioned Coast Guard account. For local development, configure
station credentials in the backend's private `.env` using the backend
`COASTGUARD_PHASE1.md` instructions.
