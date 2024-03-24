"use client";
import React, { useEffect } from "react";
import url from "url";

import { fetchTwitterUserInfo } from "./service";
import {
  AUTH_STATUS,
  isServer,
  TWITTER_AUTH_EVENT,
  TWITTER_AUTH_KEY,
} from "./helper";
import styles from "./index.module.css";

import { BroadcastChannel } from 'broadcast-channel';
import { isMobile } from "react-device-detect";

const channel = new BroadcastChannel(TWITTER_AUTH_EVENT);


const TwitterAuthCallback = (props: React.PropsWithChildren) => {
  const { children } = props;

  const onCloseWin = () => {
    window.close();
    if(isMobile) {
      window.location.href = window.location.origin + '/get-started'
    }
  }

  const sendMessage = (data: any) => {
    sessionStorage.setItem(TWITTER_AUTH_KEY, JSON.stringify(data));
    channel.postMessage({
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
