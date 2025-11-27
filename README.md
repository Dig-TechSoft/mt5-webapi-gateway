# MT5 Web API Gateway Endpoints

## Order endpoints

- GET /api/order/get/:brokerId?ticket=<ticket> — Get a single order by ticket
- GET /api/order/get_batch/:brokerId?ticket=<ticket1>,<ticket2> — Get multiple orders by comma-separated ticket list
- GET /api/order/get_total/:brokerId?login=<login> — Get the total number of open orders for a client

Examples:

- Single: http://127.0.0.1:3000/api/order/get/gd-uat?ticket=12832917
- Batch: http://127.0.0.1:3000/api/order/get_batch/gd-uat?ticket=12832917,12832918
- Total: http://127.0.0.1:3000/api/order/get_total/gd-uat?login=1020

## History endpoints (default broker)

- GET /api/history/get?ticket=<ticket> — Get closed order from history by ticket (uses default configured broker)
- GET /api/history/get_batch?ticket=<ticket1>,<ticket2> — Get multiple history orders by comma-separated ticket list (uses default broker)

Examples:

- Single: http://127.0.0.1:3000/api/history/get?ticket=12832917
- Batch: http://127.0.0.1:3000/api/history/get_batch?ticket=12832917,12832918

Note: History endpoints use the default configured broker and don't require a company/brokerId in the path. To expose additional brokers, duplicate routes and controllers for each broker ID.

## Position endpoints (default broker)

- GET /api/position/get?login=<login>&symbol=<symbol> — Get position by symbol and login (default broker)
- GET /api/position/get_batch?login=<login>&symbol=<symbol> — For hedging accounts, returns the list of positions by symbol

Examples:

- Single: http://127.0.0.1:3000/api/position/get?login=764636&symbol=EURUSD
- Batch: http://127.0.0.1:3000/api/position/get_batch?login=764636&symbol=EURUSD

Note: Position endpoints use the default configured broker when the route doesn't require a broker tag. For separate brokers, duplicate routes and controllers accordingly.

## Trade endpoints (default broker)

- GET /api/trade/balance?login=<login>&type=<2|3|4|5|6>&balance=<amount>&comment=<string>&check_margin=<0|1>
  - `type` values: 2 — balance operation, 3 — credit, 4 — additional adding/withdrawing, 5 — corrective, 6 — adding bonuses
  - `check_margin` optional: 1 = verify free margin before withdrawal, 0 = no check

Examples:

- Single: http://127.0.0.1:3000/api/trade/balance?login=764636&type=2&balance=1000&comment=onlinedeposit

## User endpoints (check password)

- POST /api/user/check_password — check a user's password (preferred; JSON body)

Example POST JSON body:

```json
{
  "Login": 764636,
  "Type": "main",
  "Password": "ps12Rt12"
}
```

Response examples:

- Valid password (success):

```json
{
  "success": true,
  "valid": true,
  "message": "Password is correct",
  "retcode": "0 Done"
}
```

- Invalid password (MT5 retcode returned raw):

```json
{ "retcode": "3006 Invalid account password" }
```

Add `raw=true` to the query or body to return the full MT5 JSON response.

### User group

- GET /api/user/group?login=<login>
- POST /api/user/group (body: {"Login":12345})

Example:

- GET: http://127.0.0.1:3000/api/user/group?login=126993
  Response (MT5 style):

```json
{
  "retcode": "0 Done",
  "answer": { "Group": "demo\\demoforex" }
}
```

### User total

- GET: http://127.0.0.1:3000/api/user/total

Response example:

```json
{
  "retcode": "0 Done",
  "answer": { "Total": "563" }
}
```

### User account (trade state)

- GET: http://127.0.0.1:3000/api/user/account/get?login=764636

Example response:

```json
{
  "retcode": "0 Done",
  "answer": {
    "Login": "764636",
    "CurrencyDigits": "2",
    "Balance": "26000.00",
    "Credit": "0.00",
    "Margin": "11.73",
    "MarginFree": "25981.83",
    "MarginLevel": "221598.98",
    "MarginLeverage": "10",
    "Profit": "-6.44"
  }
}
```

### User logins (by group)

- GET: http://127.0.0.1:3000/api/user/logins?group=demoforex,demo\\forex-usd

Example response:

```json
{
  "retcode": "0 Done",
  "answer": ["104221", "104253", "104370", "104373", "104374", "104375"]
}
```

### User certificate

- GET: http://127.0.0.1:3000/api/user/certificate/get?login=61232

Example response:

```json
{
  "retcode": "0 Done",
  "answer": [
    "-----BEGIN CERTIFICATE-----",
    "MIIClTC...",
    "-----END CERTIFICATE-----"
  ]
}
```

### User OTP Secret

- GET: http://127.0.0.1:3000/api/user/otp_secret/get?login=61232

Example response:

```json
{
  "retcode": "0 Done",
  "answer": { "OTP_SECRET": "1230987" }
}
```

### User Check Balance

- GET: http://127.0.0.1:3000/api/user/check_balance?login=611129&fixflag=1

Example response:

```json
{
  "retcode": "0 Done",
  "answer": {
    "Balance": { "User": "3000.000000", "History": "2495.000000" },
    "Credit": { "User": "100.000000", "History": "96.000000" }
  }
}
```

## Order endpoints

- GET /api/order/get/:brokerId?ticket=<ticket> — Get a single order by ticket
- GET /api/order/get_batch/:brokerId?ticket=<ticket1>,<ticket2> — Get multiple orders by comma-separated ticket list
- GET /api/order/get_total/:brokerId?login=<login> — Get the total number of open orders for a client

Examples:

- Single: http://127.0.0.1:3000/api/order/get/gd-uat?ticket=12832917
- Batch: http://127.0.0.1:3000/api/order/get_batch/gd-uat?ticket=12832917,12832918
- Total: http://127.0.0.1:3000/api/order/get_total/gd-uat?login=1020

## History endpoints (default broker)

- GET /api/history/get?ticket=<ticket> — Get closed order from history by ticket (uses default configured broker)
- GET /api/history/get_batch?ticket=<ticket1>,<ticket2> — Get multiple history orders by comma-separated ticket list (uses default broker)

Examples:

- Single: http://127.0.0.1:3000/api/history/get?ticket=12832917
- Batch: http://127.0.0.1:3000/api/history/get_batch?ticket=12832917,12832918

Note: History endpoints use the default configured broker and don't require a company/brokerId in the path. To expose additional brokers, duplicate routes and controllers for each broker ID.

## Order endpoints

Example:

Note: History endpoints use the default configured broker and don't require a company/brokerId in the path. To expose a separate broker, duplicate routes and controllers.

## Prices (Tick)

- GET: http://127.0.0.1:3000/api/tick/last?symbol=EURUSD,GBPUSD&trans_id=0

Example response:

```json
{
  "retcode": "0 Done",
  "trans_id": "8116395",
  "answer": [
    {
      "Symbol": "EURUSD",
      "Digits": "5",
      "Datetime": "1573048380",
      "DatetimeMsc": "1573048380097",
      "Bid": "1.10868",
      "Ask": "1.10871",
      "Last": "0.00000",
      "Volume": "0",
      "VolumeReal": "0.00"
    },
    {
      "Symbol": "GBPUSD",
      "Digits": "5",
      "Datetime": "1573048380",
      "DatetimeMsc": "1573048380098",
      "Bid": "1.28850",
      "Ask": "1.28858",
      "Last": "0.00000",
      "Volume": "0",
      "VolumeReal": "0.00"
    }
  ]
}
```
