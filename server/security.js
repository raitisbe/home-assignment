import session from "express-session";
import { MemoryStore } from "express-session";
import cors from "cors";

import { SESSION_SECRET, SITE_URL } from "./config.js";
import { globals } from "./global.js";
import { activeClients } from "./socket-sessions.js";
import { log } from "./logging.js";

export const sessionStore = new MemoryStore();

export function setupSecurity(app) {
  //Memory store is not for production - doesn't scale well and does not persist 
  globals.sessionStore = sessionStore;
  const sessionParser = session({
    secret: SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  });
  app.use(sessionParser);
  setupCors(app);
}

function setupCors(app) {
  app.use(
    cors({
      credentials: true,
      origin: function (origin, callback) {
        if (SITE_URL == origin) {
          callback(null, true);
        } else if (
          !origin ||
          (origin && origin.indexOf("http://localhost") > -1)
        ) {
          callback(null, true);
        } else {
          callback(new Error(origin + " Not allowed by CORS"));
        }
      },
    })
  );
}

/**
 * Create a new express session given credentials
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
export function authenticate(req, res) {
  const username = req.body.username;
  if (!username) {
    return res.status(403).json({
      success: false,
      message: "Username missing",
    });
  }
  if (activeClients.get(username)) {
    return res.status(403).json({
      success: false,
      message: "Failed to connect. Nickname already taken.",
    });
  }
  req.session.username = username;
  return res.status(200).json({
    success: true,
    sessionId: req.session.id,
  });
}

export function authenticateWs(username, cb) {
  if (!username) {
    return cb("Username missing");
  }
  log(`Socket for ${username} authenticated`);
  cb(null); //null error
}
