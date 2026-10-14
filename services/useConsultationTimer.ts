import { useEffect, useRef, useState } from "react";
import ConsultationSockets from "../services/ConsultationSockets";
import {SessionTimerResponse} from "@/app/(app)/requestFlow/consultationTimer.types";

interface UseConsultationTimerReturn {
    timerState: SessionTimerResponse | null;
    connected: boolean;
    sendSync: () => void;
}

export const useConsultationTimer = (
    session_id: string | null
): UseConsultationTimerReturn => {
    const wsRef = useRef<WebSocket | null>(null);

    const [timerState, setTimerState] = useState<SessionTimerResponse | null>(null);
    const [connected, setConnected] = useState<boolean>(false);

    useEffect(() => {
        if (!session_id) return;

        let isMounted = true;

        const initSocket = async (): Promise<void> => {
            const ws: WebSocket = await ConsultationSockets.createTimerSocket(
                session_id,
                (data: SessionTimerResponse) => {
                  //  console.log("Timer WS Data:", data);

                    if (!isMounted) return;

                    switch (data.type) {
                        case "timer_state":
                        case "timer_started":
                        case "timer_ended":
                        case "timer_paused":
                        case "timer_extended":
                        case "consultation_end_requested":
                        case "consultation_end_confirmation_required":
                        case "consultation_end_cancelled":
                        case "consultation_end_follow_up_required":
                        case "extension_denied":
                        case "extension_cancelled":
                            setTimerState(data);
                            break;

                        case "extension_requested":
                        case "extension_approved":
                        case "extension_proposed":
                        case "one_minute_warning":
                            setTimerState(previous => previous ? {...previous, ...data} : data);
                            break;

                        default:
                            console.log("Unknown WS event:", data);
                    }
                }
            );

            wsRef.current = ws;

            ws.onopen = () => {
                if (!isMounted) return;

                setConnected(true);

                // 🔄 Sync latest state
                ws.send(JSON.stringify({ type: "sync_request" }));
            };

            ws.onclose = () => {
                if (!isMounted) return;
                setConnected(false);
            };
        };

        initSocket();

        return () => {
            isMounted = false;

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [session_id]);

    const sendSync = (): void => {
        wsRef.current?.send(JSON.stringify({ type: "sync_request" }));
    };

    return {
        timerState,
        connected,
        sendSync,
    };
};
