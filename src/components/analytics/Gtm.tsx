import { Suspense } from "react";
import type { GtmConfig } from "@/lib/analytics/gtm-config";
import { CONSENT_COOKIE_JS_RE } from "@/lib/analytics/consent";
import { GtmEvents } from "./GtmEvents";

const CONSENT_TYPES = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"];

function consentDefaults(config: GtmConfig): string {
  const state = (v: string) => Object.fromEntries(CONSENT_TYPES.map((t) => [t, v]));
  let js = `gtag('consent','default',${JSON.stringify(state(config.consent.default))});`;
  if (config.consent.deniedRegions.length) {
    js += `gtag('consent','default',${JSON.stringify({
      ...state("denied"),
      region: config.consent.deniedRegions,
      wait_for_update: 500,
    })});`;
  }
  // A choice saved by the consent banner overrides the defaults before any tag fires.
  js +=
    `var sc=document.cookie.match(${CONSENT_COOKIE_JS_RE});` +
    "if(sc){var ad=sc[2]==='1'?'granted':'denied';" +
    "gtag('consent','update',{analytics_storage:sc[1]==='1'?'granted':'denied'," +
    "ad_storage:ad,ad_user_data:ad,ad_personalization:ad});}";
  return js;
}

/**
 * Container snippet for <head>. Defines dataLayer and a global gtag() (for a
 * consent banner's `gtag('consent','update',…)`), sets Consent Mode v2
 * defaults, then loads gtm.js — all before any component effect pushes events.
 */
export function GtmHead({ config }: { config: GtmConfig }) {
  const js =
    "window.dataLayer=window.dataLayer||[];" +
    "window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};" +
    consentDefaults(config) +
    (config.serverPurchase ? "window.dataLayer.push({ga4_server_purchase:true});" : "") +
    "(function(w,d,s,l,i,o){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});" +
    "var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';" +
    "j.async=true;j.src=o+'/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})" +
    `(window,document,'script','dataLayer',${JSON.stringify(config.id)},${JSON.stringify(config.origin)});`;
  return <script id="gtm" dangerouslySetInnerHTML={{ __html: js }} />;
}

/** Body part: route-change page_view/search + user data sync, and the no-JS iframe. */
export function GtmBody({ config }: { config: GtmConfig }) {
  return (
    <>
      <noscript>
        <iframe
          src={`${config.origin}/ns.html?id=${config.id}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
      <Suspense fallback={null}>
        <GtmEvents />
      </Suspense>
    </>
  );
}
