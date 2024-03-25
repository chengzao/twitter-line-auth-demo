"use client";
import React, { useEffect } from "react";
import * as jose from "jose";
import url from "url";
import { BroadcastChannel } from 'broadcast-channel';
import { isMobile } from "react-device-detect";

import { fetchLineUserInfo } from "./service";
import {
  AUTH_STATUS,
  LINE_AUTH_EVENT,
  LINE_AUTH_CLIENT_ID,
  LINE_AUTH_CLIENT_SECRET,
  isServer,
  LINE_AUTH_KEY,
  setLocalItem,
} from "./helper";

import styles from "./index.module.css";

const lineChannel = new BroadcastChannel(LINE_AUTH_EVENT);

interface LineAuthCallbackProps {
  children?: React.ReactNode;
  fallbackUrl: string;
}

const LineAuthCallback = (props: LineAuthCallbackProps) => {
  const { children,fallbackUrl } = props;
  const clientID = LINE_AUTH_CLIENT_ID;
  const clientSecret = LINE_AUTH_CLIENT_SECRET;

  const onCloseWin = () => {
    window.close();
    if(isMobile) {
      setTimeout(() => {
        window.location.href = fallbackUrl
      }, 1000)
    }
  }

  const sendMessage = (data: any) => {
    setLocalItem(LINE_AUTH_KEY, JSON.stringify(data));
    lineChannel.postMessage({
      message: {
        type: LINE_AUTH_EVENT,
        data: data,
      },
      targetOrigin: window.origin,
    }).finally(() => {
      onCloseWin()
    });
  }

  
  const fetchData = async (query: any) => {
    try {
      const redirectURI = window.location.origin+"/social-auth-callback/line";
      const params = {
        code: query.code,
        redirect_uri: redirectURI,
        client_id: clientID,
        client_secret: clientSecret,
      };

      const res = await fetchLineUserInfo(params);
      const data = jose.decodeJwt(res?.id_token);

      const sendData = {
        message: "line authorized succeed",
        type: AUTH_STATUS.SUCCESS,
        data,
      }
      sendMessage(sendData)
    } catch (error) {
      console.log('error', error)
      const sendData = {
        message: "line authorized failed",
        type: AUTH_STATUS.ERROR,
      }
      sendMessage(sendData)
    }
  };

  const fetchUserInfo = (callbackURL: any) => {
    var urlParts = url.parse(callbackURL, true);
    var query = urlParts.query;
    if (query?.code) {
      fetchData(query);
    } else {
      const sendData = {
        message: "line authorized cancel",
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

export default LineAuthCallback;
