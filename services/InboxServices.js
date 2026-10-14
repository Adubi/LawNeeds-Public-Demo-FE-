import requests from "./httpservice";

const InboxServices = {

    getUserCaseList() {
        return requests.get(`inbox/user/cases`)
    },
    getUserCaseDetails(referralId) {
        return requests.get(`inbox/user/case/${referralId}`)
    },
   /* getLawyerCaseList() {
        return requestFlow.get(`referral/lawyer_inbox?status=all`)
    },*/
    getLawyerCaseDetails(referralId) {
        return requests.get(`inbox/lawyer/case/${referralId}`)
    },
    getLawyerPendingCaseList() {
        return requests.get(`inbox/lawyer/requests`)
    },
    getLawyerActiveCaseList() {
        return requests.get(`inbox/lawyer/cases`)
    },
    sendUserTextMessage(referralId, body) {
        return requests.post(`inbox/user/case/${referralId}/text-message`, body);
    },
    getUserTextMessage(referralId) {
        return requests.get(`inbox/user/case/${referralId}/messages`);
    },
    sendLawyerTextMessage(referralId, body) {
        return requests.post(`inbox/lawyer/case/${referralId}/text-message`, body);
    },
    getLawyerTextMessage(referralId) {
        return requests.get(`inbox/lawyer/case/${referralId}/messages`);
    },
    acceptRejectRequest(data) {
        return requests.post(`referral/lawyer_response`, data)
    },
    userCancelRequest(referralId, data) {
        return requests.post(`inbox/user/case/${referralId}/cancel`, data)
    },
    userDeleteRequest(referralId) {
        return requests.delete(`inbox/user/case/${referralId}`)
    },
    sendUserMessage(referralId, body) {
        return requests.postFormData(`inbox/user/case/${referralId}/message`, body);
    },
    sendLawyerMessage(referralId, body) {
        return requests.postFormData(`inbox/lawyer/case/${referralId}/message`, body);
    },
};

export default InboxServices;