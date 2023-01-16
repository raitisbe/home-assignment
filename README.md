# Chat app

For development have two terminals open:

```
cd client
npm ci
npm run start
```

and

```
cd server
npm ci
npm run start
```


## Available Scripts

In the project directory, you can run:

### `make build-and-run`

Compiles client side code, copies the distribution files to servers public directory and starts server.

Open and see the application at [http://localhost:8080](http://localhost:8080)

## Configuration

Set .env variables which control server in server/.env file. Example:

```
ENABLE_LOG = true           #Default: true
LOG_MESSAGES = false        #Default false
HTTP_PORT = 8080
INACTIVITY_PERIOD = 25      #Default 25 seconds
INACTIVITY_POLL_PERIOD = 3  #Default 5 seconds increase when very many clients are connected
siteUrl = http://localhost:8080     # Put here client url if server and client runs on different ports ie. http://localhost:3000
SESSION_SECRET = 'xxxx'
```