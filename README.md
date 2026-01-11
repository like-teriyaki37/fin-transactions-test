### Financial Transactions Test

## Quick Start

```bash
npm install

docker compose -f docker/compose.yaml up -d

npm run db:migrate
npm run db:seed

npm run start:dev
```

## API Endpoints

```bash
# Get user balance
curl http://localhost:3000/users/1/balance

# Get user transactions
curl "http://localhost:3000/transactions?userId=1&limit=10"

# Process transaction webhook
curl -X POST http://localhost:3000/webhook/transaction \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"externalId":"tx123","providerId":"provider1","type":"credit","amount":100}'
```