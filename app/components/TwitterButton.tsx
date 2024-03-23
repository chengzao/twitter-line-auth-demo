"use client";
import React, { useState, useEffect } from "react";
import { message } from 'antd';
import { BroadcastChannel } from 'broadcast-channel';
import { isMobile } from 'react-device-detect';

import { fetchTwitterAuthUrl } from "./service";
import {
  openWindow,
  observeWindow,
  TWITTER_AUTH_EVENT,
  AUTH_STATUS,
  TWITTER_AUTH_KEY,
  TWITTER_AUTH_OWNER_KEY
} from "./helper";

interface TwitterLoginType {
  authCallback: (event: any) => void;
  redirect_uri: string;
  children?: React.ReactNode;
  fetchingAuthUrl?: (state: boolean) => void;
}

const channel = new BroadcastChannel(TWITTER_AUTH_EVENT);
// import VConsoleDebug from './VConsoleDebug'

export const TwitterLogin = (props: TwitterLoginType) => {
  const { authCallback, redirect_uri, fetchingAuthUrl, children } = props

  const [popup, setPopup] = useState<unknown>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false)

  const closingPopup = () => {
    console.log("closing popup");
    popup && (popup as any).close();
    setPopup(null);
  };

  useEffect(() => {
    channel.onmessage = (event) => {
      if(event.targetOrigin === location.origin) {
        const { type, data } = event.message;
        if (type === TWITTER_AUTH_EVENT) {
          authCallback && authCallback(data);
        }
      }
    }
  }, []);

  const handleCloseWindow = (win: any) => {
    function execClosed() {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          win?.close();
          closingPopup()
          console.log('close window', win)
          resolve('close window')
        }, 1000);
      });
    }
    execClosed().then((res) => {
      setTimeout(() => {
        messageApi.open({
          type: 'error',
          content: 'This is an error message',
        });
      }, 1000)
    })
  }

  const login = async () => {
    if (popup) {
      if (!isMobile) {
        (popup as any).focus();
        return;
      }else {
        closingPopup()
      }
    }
    fetchingAuthUrl && fetchingAuthUrl(true)
    const newWin = openWindow({ url:'', name: "Log in with Twitter" });
    setPopup(newWin);
    try {
      if(loading) return
      setLoading(true)
      const requestData = await fetchTwitterAuthUrl({redirect_uri});
      fetchingAuthUrl && fetchingAuthUrl(false)
      setLoading(false)
      if(!requestData.redirect_url) {
        handleCloseWindow(newWin)
        return
      }

      if (newWin) {
        newWin.location.href = requestData.redirect_url
        sessionStorage.removeItem(TWITTER_AUTH_KEY);
        observeWindow({ popup: newWin, onClose: closingPopup });
      }
    } catch (error) {
      console.log('error', error)
      setLoading(false)
      handleCloseWindow(newWin)
      fetchingAuthUrl && fetchingAuthUrl(false)
    }
  };

  return (
    <>
      {
        children ? (<div onClick={login}>{children}</div>): (
          <div onClick={login} className="cursor-pointer">Login with Twitter</div>
        )
      }
      {contextHolder}
    </>
  )
};

export default () => {
  const [login, setLogin] = useState(false);

  const redirect_uri = window.location.origin + "/social-auth-callback/twitter";

  const [user, setUser] = useState<any>({});

  const authCallback = (event: any) => {
    console.log('message:: ', event)
    const { type, data } = event;
    if (type === AUTH_STATUS.SUCCESS) {
      setLogin(true);
      sessionStorage.setItem(TWITTER_AUTH_KEY, JSON.stringify(event));
      setUser(data)
    }
  };

  const fetchingAuthUrl = (state: boolean) => {
    console.log('status:: ', state)
  }

  useEffect(() => {
    const userData = sessionStorage.getItem(TWITTER_AUTH_KEY);
    console.log('userData', userData)
    if (userData) {
      const {data, type} = JSON.parse(userData);
      setLogin(type === AUTH_STATUS.SUCCESS);
      type === AUTH_STATUS.SUCCESS && setUser(data);
    }
  }, [])

  return (
    <>
      <TwitterLogin fetchingAuthUrl={fetchingAuthUrl} redirect_uri={redirect_uri} authCallback={authCallback} />
      <p>Twitter Login Status: {login ? `true` : "false"}</p>
      <p>Twitter User Email: {user?.email || '-'}</p>
      <p>Twitter User Id: {user?.id_str || '-'}</p>
      {/* <VConsoleDebug /> */}
    </>
  );
};
