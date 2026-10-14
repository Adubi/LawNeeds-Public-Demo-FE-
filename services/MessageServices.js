import requests from "./httpservice";

const MessageServices = {
  SendAudioMessage(body) {
    return requests.post("speech/transcribe", body);
  },
  async GetChatStream(compressedChats, storedConversationId, detectedLanguage) {
    return await requests.getStream(`chat_stream?chats=${compressedChats}&conversation_id=${storedConversationId}&detected_language=${detectedLanguage}`)
  },
  async postChatStreamWithFile(data) {
    return await requests.postStream(`chat_stream`, data)
  },
  GetChatHistory(conversationId) {
    return requests.get(`conversations/${conversationId}/history`)
    // return requestFlow.get(`chat_feedback/conversation/${conversationId}`)
  },
  GetChatAllHistory(conversationId) {
    return requests.get(`conversations`)
    // return requestFlow.get(`chat_feedback/conversation/${conversationId}`)
  },
  getFeedbackReasons() {
    return requests.get("chat_feedback/reasons");
  },
  sendChatFeedback(body) {
    return requests.post("chat_feedback/submit", body);
  },
  deleteChatFeedback(feedbackId) {
    return requests.delete(`chat_feedback/${feedbackId}`);
  },
  /* getFeedbackHistory(conversationId) {
     return requestFlow.get(`chat_feedback/conversation/${conversationId}?limit=50`)
   }*/
  startFlow(data) {
    return requests.post(`referral/start_flow`, data);
  },
  recordVoice(data) {
    return requests.post(`referral/record_voice`, data);
  },
  uploadFile(data) {
    return requests.postFormData(`referral/upload_file`, data);
  },
  selectLawyer(data) {
    return requests.post(`referral/select_lawyer`, data);
  },
  refreshLawyers(data) {
    return requests.post(`referral/refresh_lawyers`, data);
  },
  getActiveReferralFlow(conversationId) {
    return requests.get(`referral/active_flow/${conversationId}`);
  },
  searchProfessionalListData(userType, services, area, sort, page, limit, randomSeed) {
    const params = new URLSearchParams({
      professional_type: userType || "",
      services: services || "",
      practice_area: area || "",
      page: String(page),
      limit: String(limit),
      sort_by: sort || "random",
    });
    if (randomSeed) params.set("random_seed", randomSeed);

    const requestParams = params.toString();
    return requests.get(`search/professionals?${requestParams}`);
  },
  professionalUserDetails(id) {
    return requests.get(`professionals/${id}/profile`);
  },
  professionalBookingSlots(id, fromAt, toAt, consultationType) {
    const params = new URLSearchParams({
      from: fromAt,
      to: toAt,
      consultation_type: consultationType || "single_30_min",
    });
    return requests.get(`professionals/${id}/booking-slots?${params.toString()}`);
  },
  getMyAvailability() {
    return requests.get("professionals/me/availability");
  },
  updateMyAvailability(data) {
    return requests.put("professionals/me/availability", data);
  },
  updateMyPresence(data) {
    return requests.post("professionals/me/presence", data);
  },
  requestService(lawyerId, data) {
    return requests.postFormData(`search/request-service/${lawyerId}`, data);
  },
  deleteReviews(reviewsId) {
    return requests.delete(`reviews/${reviewsId}`);
  },
  postReviews(lawyerId, reviewBody) {
    return requests.post(`professionals/${lawyerId}/reviews`, reviewBody);
  },
  getMyReviews() {
    return requests.get(`users/me/reviews`);
  },
  getCaseworkServiceBudget(serviceId) {
    return requests.get(`casework/budget-options?service=${serviceId}`);
  },
};

export default MessageServices;
