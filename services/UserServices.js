import requests from "./httpservice";

const UserServices = {
  GetProfile(body) {
    return requests.get("profile", body);
  },
  UpdateProfile(body) {
    return requests.put("profile", body);
  },
  GetProfilePic(body) {
    return requests.get("profile/picture", body);
  },
  UpdateProfilePic(body) {
    return requests.postFormData("profile/picture", body);
  },
  DeleteProfilePic(body) {
    return requests.delete("profile/picture", body);
  },
  SubmitFeedback(body) {
    return requests.postFormData('feedback/submit', body)
  },
  deleteAccount() {
    return requests.delete('account');
  },
};

export default UserServices;
