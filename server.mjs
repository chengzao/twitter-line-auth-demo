import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";

import { generateOAuthHeader,makeSignature } from './helper.mjs'
 
dotenv.config();

const app = express();

app.use(cors());

const consumer_key = process.env.TWITTER_AUTH_CONSUMER_KEY;
const consumer_secret = process.env.TWITTER_AUTH_CONSUMER_SECRET;

const callback_url = "http://localhost:3000/social-auth-callback/twitter";

app.get("/oauth/request_token", async function (req, res) {
  try {
    const oauth_signature = makeSignature({
      callback_url,
      consumer_key,
      method: "POST",
      apiUrl: "https://api.twitter.com/oauth/request_token",
      consumerSecret: consumer_secret
    })

    const result = await axios.post(
      "https://api.twitter.com/oauth/request_token",
      {},
      {
        headers: {
          Authorization: oauth_signature,
        },
      }
    );

    return res.json({ result: result.data });
  } catch (error) {
    console.log('error', error)
    return res.json({ error });
  }
});

app.get('/oauth/authenticate', async function (req, res) {
  const { oauth_token } = req.query;
  console.log('oauth_token', oauth_token);
  return res.json({ url: `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}` });
})

app.get('/oauth/access_token', async function (req, res) {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    console.log('oauth_token', oauth_token);
    console.log('oauth_verifier', oauth_verifier);
    const url = `https://api.twitter.com/oauth/access_token?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`
    const result = await axios({
      method: "POST",
      url: url,
    })
    res.json({ result: result.data });
  } catch (error) {
    console.log('error', error)
    res.json({ error });
  }
})

app.get('/account/verify_credentials', async function (req, res) {
  try {
    const { token, token_secret } = req.query;
    console.log('token', token);
    console.log('token_secret', token_secret);

    const url = 'https://api.twitter.com/1.1/account/verify_credentials.json'
    const oauth_signature = generateOAuthHeader({
      url: url,
      method: 'GET',
      consumerKey: consumer_key,
      consumerSecret: consumer_secret,
      token: token,
      tokenSecret: token_secret
    })

    const result = await axios({
      method: "GET",
      url: url,
      headers: {
        Authorization: `${oauth_signature}`,
      }
    })

    res.json({ result: result.data });
  } catch (error) {
    console.log('error', error)
    res.json({ error });
  }
})

app.listen(3004, () => {
  console.log(`Go here to login: http://127.0.0.1:3004/login`);
});
