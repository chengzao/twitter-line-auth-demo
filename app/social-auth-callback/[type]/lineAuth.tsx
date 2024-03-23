"use client";
import React, { useEffect } from "react";
import LineAuthCallback from '../../components/LineAuthCallback'

import styles from "./index.module.css";

const LineAuth = () => {
  
  useEffect(() => {
    if(typeof window !== 'undefined') {
      document.title = 'Log in With Line';
    }
  }, [])

  return (
    <LineAuthCallback>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
          Redirect<span className={styles.fadeIn}>...</span>
        </div>
      </main>
    </LineAuthCallback>
  );
};

export default LineAuth;
