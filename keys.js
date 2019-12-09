const admin = require("firebase-admin")

const {
  TYPE, PROJECT_ID, PRIVATE_KEY_ID, PRIVATE_KEY, CLIENT_EMAIL, CLIENT_ID, AUTH_URI, TOKEN_URI, AUTH_CERT, CLIENT_CERT,
  PAYPAL_ID, PAYPAL_SECRET,
  GMAIL_ID, GMAIL_SECRET,
} = process.env;

var serviceAccount = {
  "type": TYPE,
  "project_id": PROJECT_ID,
  "private_key_id": PRIVATE_KEY_ID,
  "private_key": PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": CLIENT_EMAIL,
  "client_id": CLIENT_ID,
  "auth_uri": AUTH_URI,
  "token_uri": TOKEN_URI,
  "auth_provider_x509_cert_url": AUTH_CERT,
  "client_x509_cert_url": CLIENT_CERT,
}

const firebaseAdminConfig = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://nottmystyle-447aa.firebaseio.com'
}

const CHATKIT_SECRET_KEY = "9b627f79-3aba-48df-af55-838bbb72222d:Pk9vcGeN/h9UQNGVEv609zhjyiPKtmnd0hlBW2T4Hfw="
const CHATKIT_INSTANCE_LOCATOR = "v1:us1:7a5d48bb-1cda-4129-88fc-a7339330f5eb";


//PayPal credentials
const credentials = {
  sandbox: {
    client_id: "Ab0iwKb2EyBI7XmxZtCxtYg_50u5A0y6s1su-RUWPIl6Mo34i9Wdys_RbsKZlv78UepmEhzWGOPGaMl8",
    client_secret: "ENsifoIBBtrYtzKoY5QjgqxrHeQDYEsXeiXJBwZadap3cTZeugkpvmYDUC3L_f5cxQD7GTqiVKhnlZYq"},
  live: {
    client_id: PAYPAL_ID, 
    client_secret: PAYPAL_SECRET,
  }
}

const gmailConfig = {
  type: 'oauth2',
  user: 'nottmystyleapp@gmail.com',
  clientId: GMAIL_ID,
  clientSecret: GMAIL_SECRET,
  // refreshToken: '1//04fen6SiswYSCCgYIARAAGAQSNwF-L9IrIMiFXRRF2s6xlgksRhczNbMK9f_WsYm-zhPR0cobAo02uKKynHCwcPDWcz-qU3_s6hg',
  // accessToken: 'ya29.Il-wByMm65DFRtyPRyDr4zAsRFjady5y5WOU6jkd3LNDnB9R3__dj9F2uFJDIS8CFTaZ6KwF9vM33WetNw8S_chWcOoWPmRCxALK_DKCYvf_XVWfyfrhsW2zKjvey4-Dwg',
  // accessUrl: 'https://developers.google.com/oauthplayground/',
  

}

// const GoogleAuthorizationCode = "4/tQERrEwhaF9VcQlZTuv6Onl4jJCTdOy8Wf_feui9RQI0w4YPGNHiWFMmQWkoGmX0-CpxyfiMPvwZeDtAYUIBuUE";
// 4%2FtQFAACSHFLQWCrf7Ihhy8WMRorZQJPiIHrdm9vvTszokSaHTzWEKfBeGZLXr7JfVjmGflV3iI0-O31RVfqhqcj0
// module.exports.credentials = credentials;

// module.exports.firebaseAdminConfig = firebaseAdminConfig
// module.exports.CHATKIT_SECRET_KEY = CHATKIT_SECRET_KEY
// module.exports.CHATKIT_INSTANCE_LOCATOR = CHATKIT_INSTANCE_LOCATOR

// module.exports.gmailConfig = gmailConfig;

module.exports = {
  credentials,
  firebaseAdminConfig,
  CHATKIT_SECRET_KEY,
  CHATKIT_INSTANCE_LOCATOR,
  gmailConfig,

}
