import {useEffect} from "react";

import {useTourGuideController,} from "rn-tourguide";

import {completeTour, isTourCompleted,} from "./tourStorage";

export default function AppTour() {

    const {
        start,
        eventEmitter,
    } =
        useTourGuideController();

    useEffect(() => {

        startTour();

        eventEmitter?.on(
            "stop",
            async () => {
                await completeTour("MANAGE");
            },
        );

    }, []);

    const startTour =
        async () => {

            const done =
                await isTourCompleted("MANAGE");

            if (done) return;

            setTimeout(() => {
                start();
            }, 1000);

        };

    return null;
}
