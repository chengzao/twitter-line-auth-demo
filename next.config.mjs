/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    LINE_AUTH_CLIENT_ID: process.env.LINE_AUTH_CLIENT_ID,
    LINE_AUTH_CLIENT_SECRET: process.env.LINE_AUTH_CLIENT_SECRET,
    TWITTER_AUTH_CONSUMER_KEY: process.env.TWITTER_AUTH_CONSUMER_KEY,
    TWITTER_AUTH_CONSUMER_SECRET: process.env.TWITTER_AUTH_CONSUMER_SECRET,
    TWITTER_AUTH_CLIENT_SECRET: process.env.TWITTER_AUTH_CLIENT_SECRET,
    BASE_API_URL: process.env.BASE_API_URL
  }
};

export default nextConfig;
