import { Context } from 'elysia';

export function trackingScript({ request }: Context) {
  const script = `
(function() {
  'use strict';
  
  // Configuration
  const endpoint = '${new URL(request.url).origin}/collect';
  const domain = window.location.hostname;
  
  // Utilities
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  function getSessionId() {
    let sessionId = sessionStorage.getItem('arjuna_session');
    if (!sessionId) {
      sessionId = uuid();
      sessionStorage.setItem('arjuna_session', sessionId);
    }
    return sessionId;
  }
  
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign')
    };
  }
  
  function sendEvent(data) {
    const payload = {
      url: window.location.href,
      referrer: document.referrer || undefined,
      title: document.title,
      domain: domain,
      sessionId: getSessionId(),
      ...getUTMParams(),
      ...data
    };
    
    // Use sendBeacon if available, fallback to fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {}); // Fail silently
    }
  }
  
  // Track initial pageview
  sendEvent();
  
  // Track navigation for SPAs
  let currentPath = window.location.pathname;
  
  function trackNavigation() {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      sendEvent();
    }
  }
  
  // Listen for history changes (pushState/popState)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(trackNavigation, 0);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(trackNavigation, 0);
  };
  
  window.addEventListener('popstate', trackNavigation);
  
  // Track page visibility for bounce rate
  let startTime = Date.now();
  let engaged = false;
  
  function markEngaged() {
    if (!engaged && Date.now() - startTime > 5000) { // 5 seconds = engaged
      engaged = true;
    }
  }
  
  // Events that indicate engagement
  ['scroll', 'click', 'keydown', 'mousemove', 'touchstart'].forEach(event => {
    document.addEventListener(event, markEngaged, { passive: true, once: true });
  });
  
  // Send final beacon on page unload
  window.addEventListener('beforeunload', () => {
    sendEvent({ engaged });
  });
  
  // Expose global function for manual tracking
  window.arjuna = {
    track: sendEvent,
    trackEvent: function(name, data) {
      sendEvent({ event: name, ...data });
    }
  };
})();
`;

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Access-Control-Allow-Origin': '*',
    },
  });
} 