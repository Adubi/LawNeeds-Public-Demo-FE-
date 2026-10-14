import requests from "./httpservice";

const AuthServices = {

  Login(body) {
    return requests.post("auth_user", body);
  },
  Signup(body) {
    return requests.postFormData(
        `create_user`,
        body
    );
  },
  SignupPro(body) {
    return requests.postFormData('create_pro_account', body)
  },
  ForgotPassword(body) {
    return requests.post("password/forgot", body);
  },
  VerifyOtp(body){
    return requests.post('password/verify-otp',body)
  },
  PasswordRest(body){
    return requests.post('password/reset',body)
  },
  VerifyRegistrationCode(body){
    return requests.post('email-verification/verify-registration-otp',body)
  },
  ResendRegistrationCode(body){
    return requests.post('email-verification/resend-registration-otp',body)
  },
  googleLoginAuthorize(deviceType, codeChallenge) {
    return requests.get(`oauth/google/authorize?device=${deviceType}&code_challenge=${codeChallenge}&mobile=true`);
  },
  appleLoginAuthorize(deviceType) {
    return requests.get(`oauth/apple/authorize?device=${deviceType}&mobile=true`);
  },
  googleLoginCallBack(body) {
    return requests.post("oauth/google/callback", body);
  },
  appleLoginCallBack(body) {
    return requests.postKeyValueData("oauth/apple/callback", body);
  },
};

export default AuthServices;
