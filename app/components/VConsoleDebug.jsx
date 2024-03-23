'use client'
import React, { useEffect } from 'react'
import VConsole from 'vconsole';
import { isServer } from "./helper";

const Main = () => {

  useEffect(() => {
    if(!isServer) {
      new VConsole();
    }
  }, [])

  return null
}

export default Main