import {getAuthToken} from "./httpservice";
import {CONFIG} from "@/services/environment";

if (__DEV__) {
    console.log("[ConsultationSockets] WS base URL:", CONFIG.SOCKET_URL);
}

const ConsultationSockets = {

    async createReferralSocket(conversationId, onMessage) {
        const token = await getAuthToken();

        const ws = new WebSocket(
            `${CONFIG.SOCKET_URL}ws/referral/user_status/${conversationId}?token=${token}`
        );

        attachListeners(ws, onMessage, "Referral");

        return ws;
    },

    async createTimerSocket(sessionId, onMessage) {
        const token = await getAuthToken();

        const ws = new WebSocket(
            `${CONFIG.SOCKET_URL}consultation/sessions/${sessionId}/timer?token=${token}`
        );

        attachListeners(ws, onMessage, "Timer");

        return ws;
    },

    // NEW Consultation Chat Socket
    async createConsultationChatSocket(referralId, onMessage, onOpen, onClose) {
        const token = await getAuthToken();

        const url = `${CONFIG.SOCKET_URL}ws/inbox/${referralId}?token=${token}`;

        const ws = new WebSocket(url);
        attachListeners(ws, onMessage, "Consultation Chat", onOpen, onClose);

        return ws;
    }
};

function attachListeners(ws, onMessage, type, onOpen, onClose) {
    ws.onopen = () => {
        console.log(`${type} WS connected`);
        onOpen?.();
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
          //  console.log(`RAW WS message type: "${data.type}"`, data); // ← check exact type string
            onMessage?.(data);
        } catch (e) {
            console.error(`${type} WS parse error`, e);
        }
    };

    ws.onerror = (error) => {
        console.error(`${type} WS error`, error);
    };

    ws.onclose = () => {
        console.log(`${type} WS closed`);
        onClose?.();
    };
}

export default ConsultationSockets;