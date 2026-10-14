export type TimerEventType =
    | "timer_state"
    | "timer_started"
    | "timer_ended"
    | "timer_paused"
    | "timer_extended"
    | "consultation_end_requested"
    | "consultation_end_confirmation_required"
    | "consultation_end_cancelled"
    | "consultation_end_follow_up_required"
    | "extension_requested"
    | "extension_approved"
    | "extension_proposed"
    | "extension_denied"
    | "extension_cancelled"
    | "one_minute_warning";

export interface SessionTimerResponse {
    actual_duration_seconds: number;
    elapsed_seconds: number;
    payment_status: "pending" | "transferred";
    payout_message: string;
    payout_released: boolean;
    remaining_seconds: number;
    server_time: string;
    session_end_date: string;
    session_id: string;
    session_status: "pending" | "ongoing" | "completed" | "active";
    timer_ended_at: string;
    timer_started_at: string;
    total_duration_seconds: number;
    type: TimerEventType;
    timer_paused?: boolean;
    timer_paused_at?: string | null;
    extension?: any;
    end_consultation?: {
        status: string;
        requested_at?: string | null;
        requested_by?: string | null;
        answers?: Record<string, unknown> | null;
        answered_at?: string | null;
    } | null;
    action?: "return_to_chat" | "confirm_end" | "book_follow_up";
}
