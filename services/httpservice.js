import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetch as streamFetch } from "react-native-fetch-api";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { removeTokenData } from "@/constants/Utility";
import { CONFIG } from "@/services/environment";
import CrashlyticsHelper from "@/helpers/CrashlyticsHelper";

//Terms and condition endpoints
export const standard_user_terms =
  "https://lawneeds.co.uk/term-and-conditions-users/";
export const lawyer_and_law_firm_terms =
  "https://lawneeds.co.uk/term-and-conditions-lawyers-and-law-firms/";
export const a2j_partner_terms =
  "https://lawneeds.co.uk/terms-and-conditions-a2j-partners/";
export const hr_legal_terms =
  "https://lawneeds.co.uk/terms-and-conditions-hr-legal-sme/";
export const mobile_app_terms =
  "https://lawneeds.co.uk/mobile-app-terms-conditions/";
export const faqs = "https://lawneeds.co.uk/usage-billing-faqs";
export const privacy_policy_url =
  "https://lawneeds.co.uk/privacy-policy-for-application/";
export const cancellationPolicy = "https://lawneeds.co.uk/cancellation-policy/";

const REQUEST_ID_HEADER = "X-Request-ID";

const generateRequestId = () => `req_${Crypto.randomUUID()}`;

const sanitizeEndpoint = (url = "") => url.split("?")[0] || url;

const shouldRecordApiError = (status) => !status || status >= 500;

const normalizeEndpointPath = (url = "") => {
  const endpoint = sanitizeEndpoint(url);
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
};

const noAuthRoutes = [
    "/auth_user",
    "/create_user",
    "/create_pro_account",
    "/password/forgot",
    "/password/verify-otp",
    "/password/reset",
    "/email-verification/verify-registration-otp",
    "/email-verification/resend-registration-otp",
    "/auth/google/authorize",
    "/oauth/google/callback",
    "/oauth/apple/callback",
];

const isPublicEndpoint = (url = "") => {
  const endpoint = normalizeEndpointPath(url);
  return noAuthRoutes.some(
    (route) => endpoint === route || endpoint.startsWith(`${route}/`),
  );
};

const inferFeatureFromEndpoint = (url = "") => {
  const endpoint = sanitizeEndpoint(url);

  if (endpoint.includes("chat_stream") || endpoint.includes("conversations"))
    return "chat";
  if (
    endpoint.includes("referral/upload_file") ||
    endpoint.includes("request-service")
  )
    return "document_upload";
  if (
    endpoint.includes("subscription") ||
    endpoint.includes("payment") ||
    endpoint.includes("stripe")
  )
    return "payment";
  if (
    endpoint.includes("auth") ||
    endpoint.includes("oauth") ||
    endpoint.includes("password")
  )
    return "auth";
  if (endpoint.includes("inbox")) return "inbox";
  if (endpoint.includes("identity-verification"))
    return "identity_verification";

  return "api";
};

const getHeaderValue = (headers, key) => {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(key);
  return headers[key] || headers[key.toLowerCase()];
};

const setHeaderValue = (headers, key, value) => {
  if (typeof headers.set === "function") {
    headers.set(key, value);
    return;
  }

  headers[key] = value;
};

const getStream = async (url) => {
  let authToken = await getAuthToken();
  const requestId = generateRequestId();
  const endpoint = sanitizeEndpoint(url);

  CrashlyticsHelper.log(`API stream request started: ${endpoint}`);
  await CrashlyticsHelper.setRequestContext({ requestId, endpoint });

  try {
    const response = await streamFetch(CONFIG.BASE_URL + url, {
      reactNative: { textStreaming: true },
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        [REQUEST_ID_HEADER]: requestId,
      },
    });

    await CrashlyticsHelper.setRequestContext({
      requestId,
      endpoint,
      statusCode: response.status,
      failed: !response.ok,
    });

    if (!response.ok && shouldRecordApiError(response.status)) {
      CrashlyticsHelper.log(`API stream request failed: ${endpoint}`);
      await CrashlyticsHelper.recordError(
        new Error(`API stream failed with status ${response.status}`),
        {
          feature: inferFeatureFromEndpoint(endpoint),
          endpoint,
          request_id: requestId,
          status_code: response.status,
        },
      );
    }

    return response;
  } catch (error) {
    CrashlyticsHelper.log(`API stream request crashed: ${endpoint}`);
    await CrashlyticsHelper.setRequestContext({
      requestId,
      endpoint,
      failed: true,
    });
    await CrashlyticsHelper.recordError(error, {
      feature: inferFeatureFromEndpoint(endpoint),
      endpoint,
      request_id: requestId,
    });
    throw error;
  }
};

export const getAuthToken = async () => {
  if (cachedToken) return cachedToken;

  const token = await AsyncStorage.getItem("auth_token");
  cachedToken = token;

  return token;
};

const postStream = async (url, body) => {
  const authToken = await getAuthToken();
  const requestId = generateRequestId();
  const endpoint = sanitizeEndpoint(url);

  CrashlyticsHelper.log(`API stream request started: ${endpoint}`);
  await CrashlyticsHelper.setRequestContext({ requestId, endpoint });

  try {
    const response = await streamFetch(CONFIG.BASE_URL + url, {
      reactNative: { textStreaming: true },
      method: "POST",
      body: body, // FormData here
      duplex: "half",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "text/event-stream",
        [REQUEST_ID_HEADER]: requestId,
      },
    });

    await CrashlyticsHelper.setRequestContext({
      requestId,
      endpoint,
      statusCode: response.status,
      failed: !response.ok,
    });

    if (!response.ok && shouldRecordApiError(response.status)) {
      CrashlyticsHelper.log(`API stream request failed: ${endpoint}`);
      await CrashlyticsHelper.recordError(
        new Error(`API stream failed with status ${response.status}`),
        {
          feature: inferFeatureFromEndpoint(endpoint),
          endpoint,
          request_id: requestId,
          status_code: response.status,
        },
      );
    }

    return response;
  } catch (error) {
    CrashlyticsHelper.log(`API stream request crashed: ${endpoint}`);
    await CrashlyticsHelper.setRequestContext({
      requestId,
      endpoint,
      failed: true,
    });
    await CrashlyticsHelper.recordError(error, {
      feature: inferFeatureFromEndpoint(endpoint),
      endpoint,
      request_id: requestId,
    });
    throw error;
  }
};

// Main Axios instance (for authenticated requestFlow)
const instance = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

let cachedToken = null;

export const setAuthToken = (token) => {
  cachedToken = token;
};

export const clearAuthToken = () => {
  cachedToken = null;
};

// Attach Authorization token to requestFlow (except login and register)
instance.interceptors.request.use(
  async (config) => {
    const requestId = generateRequestId();
    const endpoint = sanitizeEndpoint(config.url);

    config.headers = config.headers || {};
    setHeaderValue(config.headers, REQUEST_ID_HEADER, requestId);
    config.metadata = {
      ...(config.metadata || {}),
      requestId,
      endpoint,
    };

    CrashlyticsHelper.log(`API request started: ${endpoint}`);
    await CrashlyticsHelper.setRequestContext({ requestId, endpoint });

    // Bypass auth for login and register

    // Skip attaching token for public endpoints

    if (isPublicEndpoint(config.url)) {
      return config;
    }

    try {
      // Always get the latest token from AsyncStorage
      let authToken = await getAuthToken();

      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      } else {
        delete config.headers.Authorization;
        const authError = new Error(
          `Missing auth token for protected endpoint: ${endpoint}`,
        );
        authError.config = config;
        authError.isMissingAuthToken = true;
        return Promise.reject(authError);
      }
    } catch (e) {
      console.warn("Error retrieving token:", e);
      delete config.headers.Authorization;
      const authError = new Error(
        `Unable to load auth token for protected endpoint: ${endpoint}`,
      );
      authError.config = config;
      authError.isMissingAuthToken = true;
      return Promise.reject(authError);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  async (response) => {
    const requestId =
      response.config?.metadata?.requestId ||
      getHeaderValue(response.config?.headers, REQUEST_ID_HEADER);
    const endpoint =
      response.config?.metadata?.endpoint ||
      sanitizeEndpoint(response.config?.url);

    if (requestId) {
      await CrashlyticsHelper.setRequestContext({
        requestId,
        endpoint,
        statusCode: response.status,
        failed: response.status >= 400,
      });
    }

    return response;
  },
  async (error) => {
    if (error?.isMissingAuthToken) {
      if (__DEV__) {
        console.warn("[httpservice] skipped protected request without token:", {
          url: error.config?.metadata?.endpoint || sanitizeEndpoint(error.config?.url),
          requestId:
            error.config?.metadata?.requestId ||
            getHeaderValue(error.config?.headers, REQUEST_ID_HEADER),
        });
      }

      return Promise.reject(error);
    }

    const { response } = error;
    const requestId =
      error.config?.metadata?.requestId ||
      getHeaderValue(error.config?.headers, REQUEST_ID_HEADER);
    const endpoint =
      error.config?.metadata?.endpoint || sanitizeEndpoint(error.config?.url);
    const status = response?.status;
    const detail = response?.data?.detail;

    if (status === 401 && !isPublicEndpoint(error.config?.url)) {
      console.log("Unauthorized - Token expired");

      await removeTokenData();
      await AsyncStorage.multiRemove([
        "conversation_id",
        "conversations",
        "auth_token",
        "auth_user",
        "user_type",
        "push_token",
      ]);
      router.replace("/welcome");
    }

    if (requestId) {
      await CrashlyticsHelper.setRequestContext({
        requestId,
        endpoint,
        statusCode: status,
        failed: true,
      });
    }

    if (shouldRecordApiError(status)) {
      CrashlyticsHelper.log(`API request failed: ${endpoint}`);
      await CrashlyticsHelper.recordError(error, {
        feature: inferFeatureFromEndpoint(endpoint),
        endpoint,
        request_id: requestId,
        status_code: status,
      });
    }

    if (
      __DEV__ &&
      !(status === 403 && detail?.code === "identity_verification_required")
    ) {
      console.warn("[httpservice] request failed:", {
        message: error.message,
        code: error.code,
        url: endpoint,
        status,
        requestId,
      });
    }

    return Promise.reject(error);
  },
);

// --- Response Handler ---
const responseBody = (response) => response.data;

// --- Unified API Requests ---
const requests = {
  get: async (url, params = {}, config = {}) =>
    instance.get(url, { params, ...config }).then(responseBody),

  post: async (url, body, config = {}) =>
    instance.post(url, body, config).then(responseBody),

  postFormData: async (url, body) =>
    instance
      .post(url, body, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      })
      .then(responseBody),

  postKeyValueData: async (url, body) =>
    instance
      .post(url, body, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then(responseBody),

  put: async (url, body) => instance.put(url, body).then(responseBody),

  patch: async (url, body) => instance.patch(url, body).then(responseBody),

  delete: async (url) => instance.delete(url).then(responseBody),

  getStream,
  postStream,
};

export default requests;
