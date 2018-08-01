
// includes
require("dotenv").config();
const cmd = require("commander");
const qs = require("querystring");
const AuthenticationContext = require("adal-node").AuthenticationContext;
const express = require("express");
const urljoin = require("url-join");
const crypto = require("crypto");

// define command line parameters
cmd
    .version("0.1.0")
    .option("-p, --port <integer>", `PORT. The port to host the web services on. Defaults to "8101".`, parseInt)
    .option("-d, --directory <string>", `DIRECTORY. The name or GUID of the Azure AD containing the APP_ID.`)
    .option("-i, --app-id <string>", `APP_ID. The ID (GUID) for the Application that was created in Azure AD.`)
    .option("-k, --app-key <string>", `APP_KEY. The key from the Application that was created in Azure AD.`)
    .option("-h, --redirect-uri <string>", `REDIRECT_URI. The exact hostname that will be redirected to after the authentication.`)
    .option("-r, --resource <string>", `RESOURCE. The resource that you want to authenticate to.`)
    .parse(process.argv);

// variables
const PORT         = cmd.port        || process.env.PORT         || 8101;
const DIRECTORY    = cmd.directory   || process.env.DIRECTORY;
const APP_ID       = cmd.appId       || process.env.APP_ID;
const APP_KEY      = cmd.appKey      || process.env.APP_KEY;
const REDIRECT_URI = cmd.redirectUri || process.env.REDIRECT_URI;
const RESOURCE     = cmd.resource    || process.env.RESOURCE     || "https://management.azure.com/";
const authority    = "https://login.microsoftonline.com/";

// log
console.log(`PORT         = "${PORT}"`);
console.log(`DIRECTORY    = "${DIRECTORY}"`);
console.log(`APP_ID       = "${APP_ID}"`);
console.log(`APP_KEY      = "${APP_KEY}"`);
console.log(`REDIRECT_URI = "${REDIRECT_URI}"`);
if (!DIRECTORY || !APP_ID || !APP_KEY || !REDIRECT_URI) {
    console.error("DIRECTORY, APP_ID, APP_KEY, and REDIRECT_URI are required parameters.");
    process.exit(1);
}

// create the web server
const app = express();
app.use(express.static("www"));

// Azure AD will first return a code that can then be converted into an access token with rights as defined for the app
function getAccessTokenFromCode(code) {
    return new Promise((resolve, reject) => {
        const base = urljoin(authority, DIRECTORY);
        const authenticationContext = new AuthenticationContext(base);
        authenticationContext.acquireTokenWithAuthorizationCode(
            code,
            REDIRECT_URI,
            RESOURCE,
            APP_ID,
            APP_KEY,
            (err, response) => {
                if (!err) {
                    resolve(response);
                } else {
                    reject(err);
                }
            }
        );
    });
}

// get an authorization token from an authentication code
app.get("/token", async (req, res) => {

    // get the access token
    try {
        const tokenResponse = await getAccessTokenFromCode(req.query.code);
        res.send({
            user:  tokenResponse.userId,
            token: tokenResponse.accessToken
        });
    } catch (ex) {
        console.error(ex);
        res.status(401).send(ex);
    }

});

// starts are redirection process to authentiate
app.get("/login", (_, res) => {
    crypto.randomBytes(48, (err, buf) => {
        if (!err) {
            const token = buf.toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
            const base = urljoin(authority, DIRECTORY, "/oauth2/authorize");
            const url = `${base}?response_type=code&client_id=${qs.escape(APP_ID)}&redirect_uri=${qs.escape(REDIRECT_URI)}&state=${qs.escape(token)}&resource=${qs.escape(RESOURCE)}`;
            res.redirect(url);
        } else {
            res.status(500).send("Server Error: a crypto token couldn't be created to secure the session.");
        }
    });
});

// a sample 401 that will be handled by the service client
app.get("/redirect", (_, res) => {
    res.status(401).end();
});

// redirect to the main page
app.get("/", (_, res) => {
    res.redirect("/default.html");
});

// start listening
app.listen(PORT, () => {
    console.log(`listening on ${PORT}...`);
});
