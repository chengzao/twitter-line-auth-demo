import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";

import { generateOAuthHeader,makeSignature,parseOAuthTokens } from './helper.mjs'
 
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

    // URL必须改为排除查询参数来生成OAuth签名
    const verify_credentials_url_base = 'https://api.twitter.com/1.1/account/verify_credentials.json'
    const oauth_signature = generateOAuthHeader({
      url: verify_credentials_url_base, // 注意：在签名函数中不包含查询参数
      method: 'GET',
      consumerKey: consumer_key,
      consumerSecret: consumer_secret,
      token: parseData?.oauth_token,
      tokenSecret: parseData?.oauth_token_secret
    })

    // 现在的URL需要包括查询参数
    const verify_credentials_url_with_params = verify_credentials_url_base;
    const result = await axios({
      method: "GET",
      url: verify_credentials_url_with_params,
      headers: {
        Authorization: `${oauth_signature}`,
      }
    })

    res.status(200).json({ result: result.data });
  } catch (error) {
    // console.log('error', error)
    res.status(500).json({ error });
  }
})

app.listen(3004, () => {
  console.log(`Go here to login: http://127.0.0.1:3004/login`);
});
