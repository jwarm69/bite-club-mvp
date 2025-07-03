# 📞 Bite Club IVR Calling System

## 🎯 Overview

The Bite Club IVR (Interactive Voice Response) calling system automatically calls restaurants when new orders are placed, allowing them to accept or reject orders via phone keypad responses.

## 💰 Cost Analysis

- **Twilio Pricing:** ~$0.0085 per minute
- **Average Call Cost:** $0.01-0.02 per order
- **Monthly Estimate:** 1000 orders = $10-20/month

## 🛠 Features Implemented

### ✅ Database Schema
- **Restaurant Call Settings:**
  - `callEnabled`: Toggle calling on/off
  - `callPhone`: Custom phone number for orders
  - `callRetries`: Number of retry attempts (0-5)
  - `callTimeoutSeconds`: Call timeout (15-120 seconds)

- **Call Logging:**
  - Full call history with costs
  - Response tracking (ACCEPTED/REJECTED/NO_ANSWER/etc.)
  - Keypad responses and duration

### ✅ IVR Call Flow
```
[Call connects]
"Hello, this is Bite Club with order #12345.
Order total: $25.50 for pickup by John Smith.
Items: 2 pizza slices, 1 soda.

Press 1 to ACCEPT this order
Press 2 to REJECT this order  
Press 3 to hear order details again
Press 0 to speak with support"
```

**Response Actions:**
- **1 (Accept):** Order status → CONFIRMED, customer notified
- **2 (Reject):** Order status → CANCELLED, customer refunded
- **3 (Repeat):** Plays order details again
- **0 (Support):** Connects to support line
- **No Response:** Order remains PENDING

### ✅ Restaurant Dashboard
- **Call Settings Page** (`/restaurant/call-settings`)
  - Enable/disable automatic calling
  - Configure phone number, retries, timeout
  - View call statistics and costs
  - Call history with retry options

- **Navigation Integration**
  - Added "Call Settings" to restaurant navigation
  - Accessible from all restaurant pages

### ✅ Automatic Integration
- **Order Creation:** Calls triggered automatically when orders placed
- **Retry Logic:** Failed calls retry based on restaurant settings
- **Cost Tracking:** All call costs tracked and displayed
- **Error Handling:** Graceful fallback if calling fails

### ✅ API Endpoints

**Restaurant Endpoints:**
- `GET /api/calls/settings` - Get call settings
- `PUT /api/calls/settings` - Update call settings  
- `GET /api/calls/history` - Get call history
- `POST /api/calls/retry/:orderId` - Retry failed call

**Webhook Endpoints:**
- `GET /api/calls/twiml/:orderId` - TwiML for order
- `POST /api/calls/handle-response/:orderId` - IVR responses
- `POST /api/calls/status-callback` - Call status updates

**Admin Endpoints:**
- `GET /api/calls/admin/restaurants` - All restaurant settings
- `PUT /api/calls/admin/restaurants/:id` - Update any restaurant
- `GET /api/calls/admin/analytics` - Platform call analytics

## 🔧 Setup Requirements

### Environment Variables
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token  
TWILIO_PHONE_NUMBER=your_twilio_number
APP_URL=https://yourdomain.com  # For webhooks
```

### Webhook Configuration
In Twilio Console, configure webhooks to point to:
- TwiML: `https://yourdomain.com/api/calls/twiml/{orderId}`
- Status: `https://yourdomain.com/api/calls/status-callback`

## 📊 Restaurant Control Features

### Individual Restaurant Settings
- ✅ **Enable/Disable:** Each restaurant controls their calling
- ✅ **Custom Phone:** Separate number for order calls
- ✅ **Retry Control:** 0-5 retry attempts for failed calls
- ✅ **Timeout Control:** 15-120 second call timeouts
- ✅ **Cost Visibility:** Real-time cost tracking

### Admin Override
- ✅ **Global Management:** Admins can view/edit all restaurant settings
- ✅ **Platform Analytics:** Call volume, costs, success rates
- ✅ **Bulk Controls:** Platform-wide calling management

## 🎯 Key Benefits

1. **Restaurant Autonomy:** Full control over calling preferences
2. **Cost Transparency:** Clear tracking of all call expenses  
3. **Reliable Communication:** Automatic retries and fallbacks
4. **Simple Interface:** Basic keypad responses keep costs low
5. **Complete Integration:** Seamless with existing order flow

## 📱 Usage Flow

1. **Student places order** → Bite Club processes payment/promotions
2. **Order confirmed** → System automatically calls restaurant
3. **Restaurant answers** → Hears order details via IVR
4. **Restaurant responds** → Presses 1 (accept) or 2 (reject)
5. **System updates** → Order status updated, customer notified
6. **Call logged** → History and costs tracked in dashboard

The IVR calling system is now fully operational and ready for production use! 🚀