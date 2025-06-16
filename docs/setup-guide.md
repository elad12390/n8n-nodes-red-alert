# Complete Setup Guide: Red Alert n8n Trigger Node

This guide will walk you through the complete setup process for the Red Alert n8n trigger node.

## Prerequisites

- n8n installed (version 0.190.0 or higher)
- Node.js 18.10 or higher
- Basic understanding of n8n workflows

## Installation Steps

1. **Install via n8n Community Nodes**
   - Go to Settings → Community Nodes
   - Click Install and enter: `n8n-nodes-red-alert`
   - Restart n8n

2. **Configure Your First Workflow**
   - Create new workflow
   - Add Red Alert Trigger node
   - Configure trigger mode and intervals
   - Add notification nodes

## Configuration Examples

### Real-time Emergency Response
```json
{
  "triggerMode": "newAlerts",
  "checkInterval": 10,
  "triggerOnClear": true
}
```

### Location-Specific Monitoring
```json
{
  "triggerMode": "newAlerts",
  "filterByLocation": true,
  "locationFilter": "תל אביב, ירושלים"
}
```

## Testing

Use the Manual Trigger button to test your workflow setup.

## Support

- GitHub Issues: Report bugs and request features
- Community Forum: Get help from other users 