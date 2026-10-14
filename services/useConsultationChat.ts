import ConsultationSockets from "@/services/ConsultationSockets";
import {useEffect, useRef, useState} from "react";

type SocketEvent =
    | { type: "inbox_connection" }
    | { type: "new_message" | "message"; message_id: string; [key: string]: any };

export const useConsultationChat = (
    referralId: string | null,
    initialMessages: SocketEvent[] = []
) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [messages, setMessages] = useState<SocketEvent[]>(initialMessages);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!referralId) return;

        let isMounted = true;
        let localWs: WebSocket | null = null; // ✅ track locally too

        const initSocket = async () => {
            const ws = await ConsultationSockets.createConsultationChatSocket(
                referralId,
                (data: SocketEvent) => {
                    if (!isMounted) return;
                    switch (data.type) {
                        case "inbox_connection":
                            setConnected(true);
                            ws?.send(JSON.stringify({
                                type: "subscribe",
                                referral_id: referralId
                            }));

                            break;
                        case "new_message":
                        case "message":
                            setMessages(prev => {
                                const exists = prev.some(
                                    m => "message_id" in m && m.message_id === data.message_id
                                );
                                return exists ? prev : [...prev, data];
                            });
                            break;
                    }
                },
                () => {},
                () => {
                    if (isMounted) setConnected(false);
                }
            );

            // ✅ If cleanup already ran before this resolved, close immediately
            if (!isMounted) {
                console.log("Socket created after unmount, closing immediately");
                ws.close();
                return;
            }

            localWs = ws;
            wsRef.current = ws;
        };

        initSocket();

        return () => {
            isMounted = false;
            // ✅ Close whichever reference we have
            localWs?.close();   // ✅ always catches it via closure
            wsRef.current = null;
            localWs = null;
        };
    }, [referralId]);

    return { messages, connected };
};