# Chat app

For development we can two parts (client and server) separately. Have two terminals open:

```console
cd client
npm ci
npm run start
```

and

```console
cd server
npm ci
npm run start
```


## Available Scripts

While in the repo root directory you can run:

### Build and run the whole package

Even though client app is a SPA, it can be served from server application to do without nginx or other proxy configuration. 

```console
make build-and-run
```

It compiles the client side code, copies the distribution files to servers public directory and starts the server.

Open and see the application at [http://localhost:8080](http://localhost:8080)

## Configuration

Env file is not mandatory, but you can set .env variables which control server in server/.env file. Example:

```
ENABLE_LOG = true           #Default: true
LOG_MESSAGES = false        #Default false
HTTP_PORT = 8080
INACTIVITY_PERIOD = 25      #Default 25 seconds
INACTIVITY_POLL_PERIOD = 3  #Default 5 seconds increase when very many clients are connected
siteUrl = http://localhost:8080     # Put here client url if server and client runs on different ports ie. http://localhost:3000
SESSION_SECRET = 'xxxx'
```