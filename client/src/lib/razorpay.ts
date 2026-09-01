/**
 * Lazy loads the Razorpay Checkout SDK on demand only when a payment is initiated.
 * This prevents unnecessary network payloads and eliminates preload warnings on
 * non-payment pages (like dashboards, complaints, leaves, etc.).
 */

let razorpayLoadPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  // If already available on window, resolve immediately
  if ((window as any).Razorpay) {
    return Promise.resolve(true);
  }

  // If already loading, return existing promise to avoid duplicate script tags
  if (razorpayLoadPromise) {
    return razorpayLoadPromise;
  }

  razorpayLoadPromise = new Promise<boolean>((resolve) => {
    // Check if script tag already exists in document
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayLoadPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayLoadPromise;
}
