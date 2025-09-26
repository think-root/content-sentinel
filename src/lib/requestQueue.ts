// src/lib/requestQueue.ts
// Centralized request queue manager for API request deduplication and rate limiting

// Map to store in-flight requests by their signature (URL + method + body hash)
const inFlightRequests = new Map<string, Promise<any>>();

// Rate limiting tracking
let lastRateLimitTimestamp: number | null = null;
const RATE_LIMIT_COOLDOWN = 60000; // 1 minute cooldown period
const MAX_RETRY_DELAY = 300000; // 5 minutes maximum delay

// Request queue for rate-limited requests
const requestQueue: Array<{
  requestFn: () => Promise<any>;
  signature: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  retryCount: number;
}> = [];

/**
 * Generate a hash for request body to use in signature
 */
async function generateBodyHash(body: any): Promise<string> {
  if (!body) return '';
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(body));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Fallback to JSON string if crypto is not available
    return JSON.stringify(body);
  }
}

/**
 * Create a request signature from URL, method, and body
 */
export async function createRequestSignature(
  url: string,
  method: string,
  body?: any
): Promise<string> {
  const bodyHash = await generateBodyHash(body);
  return `${method.toUpperCase()}:${url}:${bodyHash}`;
}

/**
 * Check if we're currently in a rate-limited cooldown period
 */
export function isRateLimited(): boolean {
  if (!lastRateLimitTimestamp) return false;
  
  const now = Date.now();
  return now - lastRateLimitTimestamp < RATE_LIMIT_COOLDOWN;
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(retryCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
  // Capped at MAX_RETRY_DELAY
  const baseDelay = Math.min(1000 * Math.pow(2, retryCount), MAX_RETRY_DELAY);
  
  // Add jitter: ±25% randomness
  const jitter = 0.75 + Math.random() * 0.5;
  return Math.min(baseDelay * jitter, MAX_RETRY_DELAY);
}

/**
 * Process the request queue
 */
function processQueue(): void {
  if (isRateLimited() || requestQueue.length === 0) {
    return;
  }

  const queueItem = requestQueue.shift();
  if (!queueItem) return;

  const { requestFn, signature, resolve, reject, retryCount } = queueItem;

  // Execute the request
  executeRequest(requestFn, signature, retryCount)
    .then(resolve)
    .catch(reject);
}

/**
 * Execute a request with rate limit handling
 */
async function executeRequest(
  requestFn: () => Promise<any>,
  signature: string,
  retryCount: number = 0
): Promise<any> {
  try {
    const result = await requestFn();
    
    // Remove from in-flight requests on success
    inFlightRequests.delete(signature);
    
    // Process next item in queue
    processQueue();
    
    return result;
  } catch (error: any) {
    // Handle rate limiting (HTTP 429)
    if (error?.status === 429 || error?.statusCode === 429) {
      lastRateLimitTimestamp = Date.now();
      
      // Queue the request for retry after cooldown
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          executeRequest(requestFn, signature, retryCount + 1)
            .then(resolve)
            .catch(reject);
        }, calculateBackoffDelay(retryCount));
      });
    }
    
    // Remove from in-flight requests on error
    inFlightRequests.delete(signature);
    
    // Process next item in queue
    processQueue();
    
    throw error;
  }
}

/**
 * Queue a request with deduplication and rate limit handling
 * 
 * @param requestFn - Function that performs the actual request
 * @param signature - Unique signature for the request
 * @returns Promise that resolves with the request result
 */
export async function queueRequest<T>(
  requestFn: () => Promise<T>,
  signature: string
): Promise<T> {
  // Check if request is already in flight (deduplication)
  const existingRequest = inFlightRequests.get(signature);
  if (existingRequest) {
    return existingRequest;
  }

  // Check if we're rate limited
  if (isRateLimited()) {
    // Queue the request for later execution
    return new Promise<T>((resolve, reject) => {
      requestQueue.push({
        requestFn,
        signature,
        resolve,
        reject,
        retryCount: 0
      });
    });
  }

  // Create new request promise
  const requestPromise = executeRequest(requestFn, signature);
  
  // Store in in-flight requests map
  inFlightRequests.set(signature, requestPromise);
  
  return requestPromise;
}

/**
 * Clear all pending requests in the queue
 */
export function clearQueue(): void {
  // Reject all queued requests
  while (requestQueue.length > 0) {
    const queuedRequest = requestQueue.shift();
    if (queuedRequest) {
      queuedRequest.reject(new Error('Request cancelled due to queue clearing'));
    }
  }
}