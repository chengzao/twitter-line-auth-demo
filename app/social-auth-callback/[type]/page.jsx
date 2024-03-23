import React,{Suspense} from "react";
import { redirect } from 'next/navigation'

import Twitter from './twitterAuth'
import Line from './lineAuth'


export default function GetStarted(props) {
  const AllPages = ['twitter', 'line']
  const type = props?.params?.type

  if(!AllPages.includes(type)) {
    redirect('/', 'replace')
    return
  }

  if(type === 'line') {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Line />
      </Suspense>
    )
  }

  if(type === 'twitter') {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Twitter />
      </Suspense>
    )
  }

  return null;
}
