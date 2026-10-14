import requests from "./httpservice";

const IdentityVerificationService = {
  status() {
    return requests.get("identity-verification/status");
  },
  start() {
    return requests.post("identity-verification/start", {});
  },
  sync() {
    return requests.post("identity-verification/sync", {});
  },
};

export default IdentityVerificationService;
