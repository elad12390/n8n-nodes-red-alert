# n8n-nodes-red-alert

![n8n Red Alert Node](https://img.shields.io/badge/n8n-community%20node-FF6D5A.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/npm/v/n8n-nodes-red-alert.svg)

An n8n community trigger node for Israeli Red Alert notifications from **Pikud Ha'Oref** (Israeli Home Front Command). This node allows you to create automated workflows that respond to missile alerts, air raid warnings, and other emergency notifications in real-time.

## 🚨 Features

- **Real-time Monitoring**: Continuously monitors the official Pikud Ha'Oref API for new alerts
- **Flexible Trigger Modes**: Choose between new alerts only, all active alerts, or status changes
- **Location Filtering**: Filter alerts by specific cities or regions
- **Area-based Filtering**: Filter by predefined areas (Gaza Envelope, Tel Aviv, Jerusalem, etc.)
- **Historical Context**: Optionally include recent alert history with triggers
- **All-Clear Notifications**: Get notified when alerts are cleared
- **Enhanced Location Data**: Detailed location information including shelter times
- **Error Handling**: Robust error handling with error event emissions

## 📦 Installation

### Prerequisites

- n8n installed (version 0.190.0 or higher)
- Node.js 18.10 or higher

### Install via n8n Community Nodes

1. In your n8n instance, go to **Settings** → **Community Nodes**
2. Click **Install** and enter: `n8n-nodes-red-alert`
3. Click **Install**
4. Restart your n8n instance

### Manual Installation

```bash
# Install the package
npm install n8n-nodes-red-alert

# For pnpm users
pnpm install n8n-nodes-red-alert
```

## 🔧 Configuration

### Basic Setup

1. Add the **Red Alert Trigger** node to your workflow
2. Configure the trigger mode and check interval
3. Set up any desired filters
4. Connect subsequent nodes to handle the alert data

## 📊 Output Data

### Alert Event Structure

```json
{
  "event_type": "new_alert",
  "timestamp": "2024-06-16T14:30:00.000Z",
  "alert_count": 3,
  "has_active_alerts": true,
  "alert": {
    "id": "133042653750000000",
    "category": "1",
    "title": "ירי רקטות וטילים",
    "description": "היכנסו למרחב המוגן ושהו בו 10 דקות",
    "locations": ["שדרות", "נתיבות", "באר שבע"],
    "alert_timestamp": 1659791786927
  }
}
```

## 🔄 Example Workflows

### Basic Alert Notification

```
Red Alert Trigger → Send Email/Slack/Discord → Log to Database
```

### Location-Specific Automation

```
Red Alert Trigger (Tel Aviv only) → Check Calendar → Cancel Meetings → Notify Team
```

## ⚠️ Disclaimer

This software is provided "AS IS" without warranty. It is intended for educational and automation purposes. Users should always follow official emergency instructions and not rely solely on this tool for safety decisions.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Stay Safe** 🇮🇱
