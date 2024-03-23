import CryptoJS from "crypto-js";

export const makeSignature = ({
  callback_url,
  consumer_key,
  method,
  apiUrl,
  consumerSecret,
}) => {
  const oauth_timestamp = Math.floor(Date.now() / 1000).toString();
  const oauth_nonce = CryptoJS.lib.WordArray.random(32).toString(
    CryptoJS.enc.Hex
  );

  const credentials = {
    oauth_callback: callback_url,
    oauth_consumer_key: consumer_key,
    oauth_nonce: oauth_nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: oauth_timestamp,
    oauth_version: "1.0",
  };

  // Constructing the signature base string
  const paramsBaseString = Object.keys(credentials)
    .sort()
    .reduce((prev, el) => {
      return (prev += `&${el}=${credentials[el]}`);
    }, "")
    .substr(1);

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(
    apiUrl
  )}&${encodeURIComponent(paramsBaseString)}`;

  const signingKey = `${encodeURIComponent(consumerSecret)}&`;

  // Generating the signature
  const oauth_signature = CryptoJS.HmacSHA1(
    signatureBaseString,
    signingKey
  ).toString(CryptoJS.enc.Base64);

  // Adding the signature to the parameters list
  const oauthParams = {
    ...credentials,
    oauth_signature: encodeURIComponent(oauth_signature),
  };

  // Constructing the authorization header
  const authHeader =
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .reduce((prev, el) => {
        return (prev += `,${el}="${oauthParams[el]}"`);
      }, "")
      .substr(1);

  return authHeader;
};

export function getOAuthHeader({
  url,
  method,
  consumer_key,
  consumer_secret,
  accessToken,
  accessTokenSecret,
  oauth_nonce,
}) {
  const parameters = {
    oauth_consumer_key: consumer_key,
    oauth_token: accessToken,
    oauth_nonce: oauth_nonce,
    oauth_timestamp: Math.floor(Date.now() / 1000),
    oauth_signature_method: "HMAC-SHA1",
    oauth_version: "1.0",
  };

  // 添加include_email参数到拷贝的参数对象中，用于基础字符串的构建
  const signatureBaseParameters = {
    ...parameters,
    include_email: "true",
  };

  const parameterString = Object.keys(signatureBaseParameters)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(signatureBaseParameters[key])}`)
    .join("&");

  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(parameterString),
  ].join("&");

  const signingKey = `${encodeURIComponent(
    consumer_secret
  )}&${encodeURIComponent(accessTokenSecret)}`;
  const oauth_signature = CryptoJS.HmacSHA1(
    signatureBaseString,
    signingKey
  ).toString(CryptoJS.enc.Base64);

  // 添加签名到参数对象中
  parameters.oauth_signature = oauth_signature;

  // 创建授权头
  const authHeader =
    "OAuth " +
    Object.keys(parameters)
      .map((key) => `${key}="${encodeURIComponent(parameters[key])}"`)
      .join(", ");

  return authHeader;
}

export function parseOAuthTokens(queryString) {
  var params = queryString.split("&");
  var obj = {};

  params.forEach(function (param) {
    var pair = param.split("=");
    obj[pair[0]] = pair[1] || "";
  });
  return obj;
}
