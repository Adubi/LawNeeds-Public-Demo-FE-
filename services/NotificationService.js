import requests from "./httpservice";


const NotificationService = {
    registerDevice(body) {
        return requests.post("notifications/register_device", body);
    },
    unRegisterDevice(body) {
        return requests.post(`notifications/unregister_device`, body)
    },
    deleteDevice(deviceId) {
        return requests.get(`notifications/device/${deviceId}`)
    },
    sendTestNotification(body) {
        return requests.post(`notifications/test`, body)
    },
    getUserDevices() {
        return requests.get(`notifications/devices`)
    },
    sendPushNotification(body) {
        return requests.post(`notifications/send`, body)
    },
    getNotificationsList(unreadOnly = false) {
        return requests.get(`notifications/list${unreadOnly ? "?unread_only=true" : ""}`)
    },
    markNotificationsRead(body) {
        return requests.post(`notifications/mark_read`, body)
    },

}

export default NotificationService;
