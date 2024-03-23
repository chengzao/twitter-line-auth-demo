import { isMobile } from "react-device-detect";

// window postmessage event name
export const TWITTER_AUTH_EVENT = "authorized_twitter_callback";
export const LINE_AUTH_EVENT = "authorized_line_callback";

// twitter & line local storage key
export const TWITTER_AUTH_OWNER_KEY = "twitter_owner_auth"; // set twitter auth key and secret
export const TWITTER_AUTH_KEY = "twitter_auth";
export const LINE_AUTH_KEY = "line_auth";

// line client id and secret
export const LINE_AUTH_CLIENT_ID = process.env.LINE_AUTH_CLIENT_ID || ''
export const LINE_AUTH_CLIENT_SECRET = process.env.LINE_AUTH_CLIENT_SECRET || ''

// twitter clientId & consumerKey
export const TWITTER_AUTH_CONSUMER_KEY = process.env.TWITTER_AUTH_CONSUMER_KEY || ''
export const TWITTER_AUTH_CONSUMER_SECRET = process.env.TWITTER_AUTH_CONSUMER_SECRET || ''

// twitter & line events type
export enum AUTH_STATUS {
  SUCCESS = "success",
  CANCEL = "cancel",
  ERROR = "error"
}

interface OpenWindow {
  url: string;
  name?: string;
  width?: number;
  height?: number;
}

export const isServer = typeof window === 'undefined';

export const openWindow = ({ url, name, width=400, height=500 }: OpenWindow) => {
  const top = (window.innerHeight - 400) / 2 + window.screenY;
  const left = (window.innerWidth - 400) / 2 + window.screenX;

  if(isMobile) {
    window.location.href = url;
    return window
  }else {
    return window.open(
      url,
      name,
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, dialog=yes,top=${top}px,left=${left},width=${width}px,height=${height}px`
    );
  }

};

interface SendMessageType {
  targetWindow: Window;
  message: object;
  targetOrigin?: string;
  closed?: boolean;
}

export const sendMessageForWindow = ({targetWindow, message, targetOrigin, closed=true}: SendMessageType) => {
  if (!targetWindow || targetWindow.closed) {
    console.error('Target window does not exist');
    return;
  }
  targetOrigin = targetOrigin || '*';
  targetWindow.postMessage(message, targetOrigin);
  // closed && window.close();
}

interface ReceiveMessageType {
  expectedOrigin: string;
  callback: (arg: any) => void;
}

export const receiveMessageForWindow =({expectedOrigin, callback}: ReceiveMessageType) => {
  if(typeof window === 'undefined') {
    console.error('Target window does not exist');
    return;
  }

  if (typeof callback !== 'function') {
    console.error('Callback must be a function');
    return;
  }

  window.addEventListener('message', function(event) {
    if (expectedOrigin && event.origin !== expectedOrigin) {
      console.error('Received message from unexpected origin:', event.origin);
      return;
    }
    callback && callback(event);
  }, false);
}

interface ObserveWindow {
  popup: Window;
  interval?: number;
  onClose: () => void;
}

export const observeWindow = ({ popup, interval, onClose }: ObserveWindow) => {
  const intervalId = setInterval(() => {
    if (popup.closed) {
      clearInterval(intervalId);
      onClose();
    }
  }, interval || 100);
};

export const generateRandomString = (length: number) => {
  var randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var result = "";
  for (var i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
}