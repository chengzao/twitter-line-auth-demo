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
  setLocalItem,
  removeLocalItem,
  getLocalItem
} from "./helper";

interface TwitterLoginType {
  authCallback: (event: any) => void;
  redirect_uri: string;
  children?: React.ReactNode;
  onFetchingAuthUrl?: (state: boolean) => void;
}

const twitterChannel = new BroadcastChannel(TWITTER_AUTH_EVENT);
// import VConsoleDebug from './VConsoleDebug'

export const TwitterLogin = (props: TwitterLoginType) => {
  const { authCallback, redirect_uri, onFetchingAuthUrl, children } = props

  const [popup, setPopup] = useState<unknown>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false)

  const closingPopup = () => {
    console.log("closing popup");
    popup && (popup as any).close();
    setPopup(null);
  };

  useEffect(() => {
    twitterChannel.onmessage = (event) => {
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
    onFetchingAuthUrl && onFetchingAuthUrl(true)

    let newWin = undefined
    
    if(!isMobile) {
      newWin = openWindow({ url:'', name: "Log in with Twitter" });
      setPopup(newWin);
    }

    try {
      if(loading) return
      setLoading(true)
      const requestData = await fetchTwitterAuthUrl({redirect_uri});
      const twitter_auth_url = requestData.redirect_url
      onFetchingAuthUrl && onFetchingAuthUrl(false)
      setLoading(false)
      if(!twitter_auth_url) {
        !isMobile && handleCloseWindow(newWin)
        return
      }

      if(isMobile) {
        newWin = openWindow({ url: twitter_auth_url, name: "Log in with Twitter" });
      }

      if (newWin) {
        newWin.location.href = twitter_auth_url
        removeLocalItem(TWITTER_AUTH_KEY);
        observeWindow({ popup: newWin, onClose: closingPopup });
      }
    } catch (error) {
      console.log('error', error)
      setLoading(false)
      !isMobile && handleCloseWindow(newWin)
      onFetchingAuthUrl && onFetchingAuthUrl(false)
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
    console.log('twitter message:: ', event)
    const { type, data } = event;
    setLogin(type === AUTH_STATUS.SUCCESS);
    setUser(data);
  };

  const onFetchingAuthUrl = (state: boolean) => {
    console.log('twitter fetching auth url status:: ', state)
  }

  useEffect(() => {
    const userData = getLocalItem(TWITTER_AUTH_KEY);
    console.log('twitter userData:: ', userData)
    if (userData) {
      const {data, type} = userData;
      setLogin(type === AUTH_STATUS.SUCCESS);
      setUser(data);
    }
  }, [])

  return (
    <>
      <TwitterLogin onFetchingAuthUrl={onFetchingAuthUrl} redirect_uri={redirect_uri} authCallback={authCallback} />
      <p>Twitter Login Status: {login ? `true` : "false"}</p>
      <p>Twitter User Email: {user?.email || '-'}</p>
      <p>Twitter User Id: {user?.id_str || '-'}</p>
      {/* <VConsoleDebug /> */}
    </>
  );
};
