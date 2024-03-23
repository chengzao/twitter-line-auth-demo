import querystring from "query-string";

const apiBaseUrl = process.env.BASE_API_URL;

// fetch twitter login auth url
// return { redirect_url, owner_key, owner_secret }
export const fetchTwitterAuthUrl = async ({redirect_uri}: { redirect_uri: string }) => {

  const url = `${apiBaseUrl}/authentication/x-auth-token?callback_url=${encodeURIComponent(redirect_uri)}`
  return fetch(url).then((res) => res.json());
};

// fetch twitter user info
export const fetchTwitterUserInfo = async ({
  oauth_token,
  oauth_verifier,
}: {
  oauth_token: string;
  oauth_verifier: string;
}) => {

  const url = `${apiBaseUrl}/authentication/through-verify-get-x-user?oauth_verifier=${oauth_verifier}&oauth_token=${oauth_token}`
  return fetch(url).then((res) => res.json());
};

// fetch line user info
export const fetchLineUserInfo = async ({
  code,
  redirect_uri,
  client_id,
  client_secret
}: {
  code: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string
}) => {
  const params = { grant_type: "authorization_code",code,redirect_uri,client_id,client_secret};

  return fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: querystring.stringify(params),
  }).then((res) => res.json());
}
