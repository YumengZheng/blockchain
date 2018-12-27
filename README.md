Node.js Framework -- express.js

```
npm install
```

```
node app.js
```

API testing

```
curl -X POST \
   http://localhost:8000/api/block \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
    "data":"test test test"
}'
```

```
curl -X GET \
   http://localhost:8000/api/block/0 \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
```
