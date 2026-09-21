import { Suspense } from "react";
import { META_USER_DATA_KEY } from "@/lib/analytics/meta-shared";
import { CONSENT_COOKIE_JS_RE } from "@/lib/analytics/consent";
import { MetaPixelEvents } from "./MetaPixelEvents";

/** Pixel ids are numeric; anything else from admin settings is ignored (and never injected). */
export function isValidPixelId(id: string | null | undefined): id is string {
  return !!id && /^\d{6,20}$/.test(id);
}

/**
 * Base Pixel snippet for <head>. Runs before hydration so fbq is defined —
 * and already initialised with stored advanced-matching data — before any
 * component effect tracks an event. PageView is fired by MetaPixelEvents
 * (with an event_id shared with CAPI), not here.
 *
 * Marketing consent (banner cookie, else this visitor's default) gates the
 * Pixel via fbq('consent'); `relay: false` hands CAPI to server-side GTM.
 */
export function MetaPixelHead({
  pixelId,
  marketingDefault,
  relay,
}: {
  pixelId: string;
  marketingDefault: boolean;
  relay: boolean;
}) {
  const id = JSON.stringify(pixelId);
  const js =
    "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +
    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;" +
    "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;" +
    "t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}" +
    "(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
    (relay ? "" : "window.smMetaRelay=false;") +
    `var sc=document.cookie.match(${CONSENT_COOKIE_JS_RE});` +
    `if(!(sc?sc[2]==='1':${marketingDefault ? "true" : "false"}))fbq('consent','revoke');` +
    `var ud={};try{ud=JSON.parse(localStorage.getItem(${JSON.stringify(META_USER_DATA_KEY)})||'{}')}catch(e){}` +
    `fbq('init',${id},ud);`;
  return <script id="meta-pixel" dangerouslySetInnerHTML={{ __html: js }} />;
}

/** Body part: route-change PageView/Search tracking + no-JS fallback beacon. */
export function MetaPixelBody({
  pixelId,
  marketingDefault,
}: {
  pixelId: string;
  /** No-JS visitors can't answer the banner — only beacon when consent is the default. */
  marketingDefault: boolean;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <MetaPixelEvents />
      </Suspense>
      {marketingDefault && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          />
        </noscript>
      )}
    </>
  );
}
