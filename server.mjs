import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import CryptoJS from 'crypto-js'

import { makeSignature,parseOAuthTokens,getOAuthHeader } from './helper.mjs'
 
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

app.get('/authentication/x-auth-token', async function (req, res) {
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

    const {oauth_token} = parseOAuthTokens(result.data)
    
    return res.json({ redirect_url: `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}` });
  } catch (error) {
    console.log('error', error)
    return res.json({ error });
  }  
})

app.get('/authentication/through-verify-get-x-user', async function (req, res) {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    console.log('oauth_token', oauth_token);
    console.log('oauth_verifier', oauth_verifier);
    const access_token_url = `https://api.twitter.com/oauth/access_token?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`
    const accessTokenData = await axios({
      method: "POST",
      url: access_token_url,
    })

    const parseData = parseOAuthTokens(accessTokenData.data)

    console.log('parseData :: ', parseData)

    const accessToken = parseData?.oauth_token;
    const accessTokenSecret = parseData?.oauth_token_secret;
    const oauth_nonce = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    
    // Twitter API endpoint
    const endpoint = "https://api.twitter.com/1.1/account/verify_credentials.json";
    const method = 'GET';
    const endpointWithParams = `${endpoint}?include_email=true`;
    
    // 获取OAuth授权头部
    const oauthHeader = getOAuthHeader({
      url: endpoint,
      method,
      consumer_key,
      consumer_secret,
      accessToken,
      accessTokenSecret,
      oauth_nonce
    });
    
    axios.get(endpointWithParams, {
      headers: {
        "Authorization": oauthHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
    .then(response => {
      res.status(200).json({ result: response.data });
    })
    .catch(error => {
      console.error('Authentication request failed', error);
      res.status(500).json({ error });
    });

  } catch (error) {
    res.status(500).json({ error });
  }
})

app.listen(3004, () => {
  console.log(`Go here to login: http://127.0.0.1:3004/login`);
});
