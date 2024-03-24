"use client";
import React, { useEffect, useState } from "react";
import querystring from "query-string";
import { BroadcastChannel } from 'broadcast-channel';
import { isMobile } from "react-device-detect";

import {
  openWindow,
  observeWindow,
  generateRandomString,
  LINE_AUTH_EVENT,
  LINE_AUTH_CLIENT_ID,
  AUTH_STATUS,
  LINE_AUTH_KEY,
} from "./helper";

interface LineLoginType {
  children?: React.ReactNode;
  clientID: string;
  state: string;
  nonce: string;
  scope: string;
  redirectURI: string;
  authCallback: (event: any) => void;
}

const maxAge = 120;
const lineChannel = new BroadcastChannel(LINE_AUTH_EVENT);

// import VConsoleDebug from './VConsoleDebug'

export const LineLogin = (props: LineLoginType) => {
  const {
    clientID,
    state,
    nonce,
    scope,
    redirectURI,
    authCallback,
    children
  } = props

  const [popup, setPopup] = useState<unknown>(null);

  const closingPopup = () => {
    console.log("closing popup");
    popup && (popup as any).close();
    setPopup(null);
  };

  useEffect(() => {
    lineChannel.onmessage = (event) => {
      if(event.targetOrigin === location.origin) {
        const { type, data } = event.message;
        if (type === LINE_AUTH_EVENT) {
          authCallback && authCallback(data);
        }
      }
    }
  }, []);

  const handleOpenAuth = ({ url, name }: { url: string; name: string }) => {
    if (!url) return;

    const newWin = openWindow({
      url: url,
      name: name,
    });

    if (newWin) {
      setPopup(newWin);
      sessionStorage.removeItem(LINE_AUTH_KEY);
      observeWindow({ popup: newWin, onClose: closingPopup });
    }
  };

  const login = () => {
    if (popup) {
      if (!isMobile) {
        (popup as any).focus();
        return;
      }else {
        closingPopup()
      }
    }

    const query = querystring.stringify({
      response_type: "code",
      client_id: clientID,
      state: state,
      scope: scope,
      nonce: nonce,
      prompt: "consent",
      max_age: maxAge,
      bot_prompt: "normal",
      disable_auto_login: true
    });

    const lineAuthorizeURL =
      "https://access.line.me/oauth2/v2.1/authorize?" +
      query +
      "&redirect_uri=" +
      redirectURI;

    handleOpenAuth({ url: lineAuthorizeURL, name: "Log in with Line" });
  };

  return ( children ? <div onClick={login}>{children}</div> : <div onClick={login} className="cursor-pointer">Login with Line</div>)
};

export default () => {
  const randomString = generateRandomString(10);
  const [login, setLogin] = useState(false);
  const [user, setUser] = useState<any>({});

  const client_id = LINE_AUTH_CLIENT_ID;
  const redirect_uri = window.location.origin+"/social-auth-callback/line";

  const authCallback = (event: any) => {
    console.log('line message:: ', event)
    const { type, data } = event;
    if (type === AUTH_STATUS.SUCCESS) {
      setLogin(true);
      sessionStorage.setItem(LINE_AUTH_KEY, JSON.stringify(event));
      setUser(data)
    }
  };

  useEffect(() => {
    const userData = sessionStorage.getItem(LINE_AUTH_KEY);
    console.log('line userData:: ', userData)
    if (userData) {
      const {data, type} = JSON.parse(userData);
      setLogin(type === AUTH_STATUS.SUCCESS);
      type === AUTH_STATUS.SUCCESS && setUser(data);
    }
  }, [])

  return (
    <>
      <LineLogin
        clientID={client_id}
        state={randomString}
        nonce={randomString}
        scope="profile openid email"
        redirectURI={redirect_uri}
        authCallback={authCallback}
      />
      {/* <VConsoleDebug /> */}
      <p>Line Login Status: {login ? `true` : "false"}</p>
      <p>Line User Email: {user?.email || '-'}</p>
      <p>Line User Id: {user?.sub || '-'}</p>
    </>
  );
};
