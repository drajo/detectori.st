declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

let scriptPromise: Promise<void> | null = null;

export function loadRecaptcha(): Promise<void> {
  if (!SITE_KEY) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-recaptcha]');
    if (existing) return resolve();
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    s.defer = true;
    s.dataset.recaptcha = 'true';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export async function executeRecaptcha(action: string): Promise<string | undefined> {
  if (!SITE_KEY) return undefined;
  await loadRecaptcha();
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) return reject(new Error('grecaptcha not available'));
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha!.execute(SITE_KEY, { action });
        resolve(token);
      } catch (err) {
        reject(err);
      }
    });
  });
}
