"use client";
import React, { useEffect } from "react";
import url from "url";
import { BroadcastChannel } from 'broadcast-channel';
import { isMobile } from "react-device-detect";

import { fetchTwitterUserInfo } from "./service";
import {
  AUTH_STATUS,
  isServer,
  TWITTER_AUTH_EVENT,
  TWITTER_AUTH_KEY,
  setLocalItem,
} from "./helper";
import styles from "./index.module.css";

const twitterChannel = new BroadcastChannel(TWITTER_AUTH_EVENT);

interface TwitterAuthCallbackProps {
  children?: React.ReactNode;
  fallbackUrl: string;
}

const TwitterAuthCallback = (props: TwitterAuthCallbackProps) => {
  const { children,fallbackUrl } = props;

  const onCloseWin = () => {
    window.close();
    if(isMobile) {
      setTimeout(() => {
        window.location.href = fallbackUrl
      }, 1000)
    }
  }

  const sendMessage = (data: any) => {
    setLocalItem(TWITTER_AUTH_KEY, JSON.stringify(data));
    twitterChannel.postMessage({
      message: {
        type: TWITTER_AUTH_EVENT,
        data: data,
      },
      targetOrigin: window.origin,
    }).finally(() => {
      onCloseWin()
    });
  }


  const fetchData = async (query: any) => {
    try {
      const { oauth_verifier,oauth_token  } = query;
      const userInfo = await fetchTwitterUserInfo({ oauth_token, oauth_verifier });
      if(!userInfo?.result) {
        throw new Error("fetch data error");
      }
      const sendData = {
        message: "twitter authorized succeed",
        type: AUTH_STATUS.SUCCESS,
        data: userInfo?.result,
      }
      sendMessage(sendData)
    } catch (error) {
      console.log('error', error)
      const sendData = {
        message: "twitter authorized failed",
        type: AUTH_STATUS.ERROR,
      }
      sendMessage(sendData)
    }
  };

  const fetchUserInfo = (callbackURL: any) => {
    var urlParts = url.parse(callbackURL, true);
    var query = urlParts.query;
    const { oauth_token, oauth_verifier } = query;
    if (oauth_token && oauth_verifier) {
      fetchData(query);
    } else {
      const sendData = {
        message: "twitter authorized cancel",
        type: AUTH_STATUS.CANCEL,
      }
      sendMessage(sendData)
    }
  };

  useEffect(() => {
    !isServer && fetchUserInfo(window.location.href);
    return () => {
      !isServer && window.close();
    };
  }, []);

  return (
    <>
      {children ? children : <div className={styles.loading}>Loading...</div>}
    </>
  );
};

export default TwitterAuthCallback;
