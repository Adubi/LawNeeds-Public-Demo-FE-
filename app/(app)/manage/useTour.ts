import {useCallback, useEffect, useState, useContext} from "react";
import {InteractionManager} from "react-native";
import {useFocusEffect} from "@react-navigation/native";
import {useTourGuideController} from "rn-tourguide";
import {TourKey, isTourCompleted, completeTour} from "@/app/(app)/manage/tourStorage";
import {TourCanStartContext} from "@/app/(app)/manage/PageTourProvider";

type State = "idle" | "pending" | "started" | "done";

// useTour.ts
export function useTour(key: TourKey, isReady = false) {
    const {start, eventEmitter} = useTourGuideController();
    const canStart = useContext(TourCanStartContext);
    const [state, setState] = useState<State>("idle");

    // ✅ Re-check storage whenever isReady becomes true
    useEffect(() => {
        if (!isReady) return;
        setState("idle");
        isTourCompleted(key).then((done) => {
            setState(done ? "done" : "pending");
        });
    }, [isReady, key]);

    useFocusEffect(
        useCallback(() => {
            setState("idle");
            isTourCompleted(key).then((done) => {
                setState(done ? "done" : "pending");
            });
            return () => setState("idle");
        }, [key])
    );

    useEffect(() => {
        if (state !== "pending" || !canStart || !isReady) return;
        setState("started");
        const task = InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
                start();
                setTimeout(() => start(), 100);
            }, 300);
        });
        return () => task.cancel();
    }, [state, canStart, isReady]);

    useEffect(() => {
        const handler = () => {
            completeTour(key);
            setState("done");
        };
        eventEmitter?.on("stop", handler);
        return () => eventEmitter?.off("stop", handler);
    }, [eventEmitter, key]);
}