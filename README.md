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
