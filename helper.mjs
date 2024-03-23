import CryptoJS from 'crypto-js'

export function generateOAuthHeader({url, method, consumerKey, consumerSecret, token, tokenSecret, additionalParams}) {
  // 生成随机的字符串作为oauth_nonce，并获取当前时间戳
  const oauth_nonce = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  const oauth_timestamp = Math.floor(Date.now() / 1000).toString();

  // 准备OAuth参数
  const oauthParameters = {
    oauth_consumer_key: consumerKey,
    oauth_nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp,
    oauth_token: token,
    oauth_version: '1.0'
  };

  // 按照OAuth协议规定，将所有参数排序并进行URL编码
  const encodedParams = Object.keys(oauthParameters)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParameters[key])}`)
    .join('&');

  // 确保包含了所有必要的查询参数在签名中
  const baseStringAdditionalParams = additionalParams ? '&' + new URLSearchParams(additionalParams).toString() : '';  

  // 构造签名的基础字符串
  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url.split('?')[0]), // 只取URL主体部分，去除查询参数
    encodeURIComponent(encodedParams + baseStringAdditionalParams) // 参数编码后，包含额外的查询参数
  ].join('&');

  // 生成签名的密钥
  const signingKey = [
    encodeURIComponent(consumerSecret),
    encodeURIComponent(tokenSecret || '')
  ].join('&'); // If there's no tokenSecret, use an empty string

  // 生成签名
  const signature = CryptoJS.HmacSHA1(signatureBaseString, signingKey).toString(CryptoJS.enc.Base64);

  // 将签名加入参数中
  oauthParameters['oauth_signature'] = signature;

  // 构建完整的OAuth认证头部
  const authHeader = 'OAuth ' + Object.keys(oauthParameters)
    .sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParameters[k])}"`)
    .join(', ');

  return authHeader;
}

export const makeSignature = ({
  callback_url,
  consumer_key,
  method,
  apiUrl,
  consumerSecret
}) => {
  const oauth_timestamp = Math.floor(Date.now() / 1000).toString();
  const oauth_nonce = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);

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
   const oauth_signature = CryptoJS.HmacSHA1(signatureBaseString, signingKey).toString(CryptoJS.enc.Base64);

  // Adding the signature to the parameters list  
  const oauthParams = {
    ...credentials,
    oauth_signature: encodeURIComponent(oauth_signature)
  };

  // Constructing the authorization header
  const authHeader = "OAuth " + Object.keys(oauthParams)
    .sort()
    .reduce((prev, el) => {
      return (prev += `,${el}="${oauthParams[el]}"`);
    }, "")
    .substr(1);

  return authHeader;  
};

export function parseOAuthTokens(queryString) {
  var params = queryString.split('&');
  var obj = {};
  
  params.forEach(function(param) {
    var pair = param.split('=');
    obj[pair[0]] = pair[1] || '';
  });
  return obj;
}
