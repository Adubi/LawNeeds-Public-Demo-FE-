import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { Audio } from "expo-av";

export function manageVoiceRecorder(
    processAudio: (uri: string, referralState: any) => Promise<void>,
    t: (key: string) => string
) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [readyToRecord, setReadyToRecord] = useState(false);
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);


    const [waveformBars, setWaveformBars] = useState<number[]>(Array(40).fill(4));
    const waveformIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Stores the last saved URI when paused
    const pausedUriRef = useRef<string | null>(null);
    const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const referralRef = useRef<any>(null);
    const previewSoundRef = useRef<Audio.Sound | null>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const stopAndSendRef = useRef<() => Promise<void>>(() => Promise.resolve()); // ✅ move here


    useEffect(() => {
        recordingRef.current = recording;
    }, [recording]);

    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            if (waveformIntervalRef.current) clearInterval(waveformIntervalRef.current); // ✅ add
            previewSoundRef.current?.unloadAsync().catch(() => {});
        };
    }, []);


    // ─── STEP 7: Stop + send immediately (green button) ──────────────────────────
    const stopAndSendRecording = useCallback(async () => {
        await _stopPreviewSound();

        const uri = await _internalStop();
        const finalUri = uri ?? pausedUriRef.current ?? null;
        pausedUriRef.current = null;
        setRecordingDuration(0);
        setIsPaused(false);      // ✅ ADD THIS — clears paused UI
        setIsRecording(false);   // ✅ ADD THIS — safety reset
        setWaveformBars(Array(40).fill(4)); // ✅ ADD THIS — reset waveform

        if (finalUri) {
            setIsPlayingPreview(false);
            setRecordedUri(null);
            await processAudio(finalUri, referralRef.current);
        }
    }, [processAudio]);

    useEffect(() => {
        stopAndSendRef.current = stopAndSendRecording;
    }, [stopAndSendRecording]);

    // ─── Shared: stop & clear timer ─────────────────────────────────────────────
    const _stopTimer = () => {
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
    };

    // ─── Shared: start duration timer ───────────────────────────────────────────
    const _startTimer = (onAutoStop: () => void) => {
        recordingIntervalRef.current = setInterval(() => {
            setRecordingDuration((prev) => {
                if (prev >= 1500) {
                    onAutoStop();
                    return 0;
                }
                return prev + 1;
            });
        }, 1000);
    };

    // ─── Shared: stop audio playback ────────────────────────────────────────────
    const _stopPreviewSound = async () => {
        if (previewSoundRef.current) {
            await previewSoundRef.current.stopAsync().catch(() => {});
            await previewSoundRef.current.unloadAsync().catch(() => {});
            previewSoundRef.current = null;
        }
        setIsPlayingPreview(false);
    };

    const _internalStop = async (): Promise<string | null> => {
        const current = recordingRef.current;
        if (!current) return null;

        _stopTimer();
        _stopWaveform();   // ← ADD
        setIsRecording(false);
        setIsPaused(false);

        try {
            await current.stopAndUnloadAsync();
        } catch (_) {}

        const uri = current.getURI() ?? null;
        setRecording(null);
        recordingRef.current = null;

        return uri;
    };

    // ─── STEP 1: handleVoiceRecording ────────────────────────────────────────────
    const handleVoiceRecording = useCallback(
        async (referralLastState: string | null = null): Promise<boolean> => {
            referralRef.current = referralLastState;

            if (recordedUri) return false;

            if (isRecording && recordingRef.current) {
                await _internalStop();
                return false;
            }

            if (readyToRecord) {
                setReadyToRecord(false);
                return false;
            }

            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                Alert.alert(t("per.permission_denied"), t("per.microphone_access"));
                return false;
            }

            setReadyToRecord(true);
            return true;
        },
        [isRecording, readyToRecord, recordedUri]
    );

    // ─── Shared: create and start a new Audio.Recording instance ────────────────
    const _createAndStart = async (): Promise<Audio.Recording> => {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
        });

        const newRecording = new Audio.Recording();

        await newRecording.prepareToRecordAsync({
            isMeteringEnabled: true,   // ← ADD THIS
            ios: {
                extension: ".wav",
                outputFormat: Audio.IOSOutputFormat.LINEARPCM,
                audioQuality: Audio.IOSAudioQuality.HIGH,
                sampleRate: 44100,
                numberOfChannels: 1,
                bitRate: 128000,
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
            },
            android: {
                extension: ".m4a",
                outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                audioEncoder: Audio.AndroidAudioEncoder.AAC,
                sampleRate: 44100,
                numberOfChannels: 1,
                bitRate: 128000,
            },
            web: {
                mimeType: "audio/webm",
                bitsPerSecond: 128000,
            },
        });

        await newRecording.startAsync();
        return newRecording;
    };

    const _stopWaveform = () => {
        if (waveformIntervalRef.current) {
            clearInterval(waveformIntervalRef.current);
            waveformIntervalRef.current = null;
        }
    };

    const _startWaveform = (recordingInstance: Audio.Recording) => {
        _stopWaveform();
        waveformIntervalRef.current = setInterval(async () => {
            try {
                const status = await recordingInstance.getStatusAsync();
                if (!status.isRecording) return;

                // metering is in dB: -160 (silence) to 0 (max)
                const db = status.metering ?? -60;

                // Normalize -60..0 dB → 0..1
                const normalized = Math.max(0, Math.min(1, (db + 60) / 60));

                // Convert to bar height: min 3px, max 28px
                const newBarHeight = Math.max(3, normalized * 28);

                setWaveformBars((prev) => {
                    const next = [...prev.slice(1), newBarHeight]; // shift left, push new
                    return next;
                });
            } catch (_) {}
        }, 100); // sample every 100ms
    };



    const startRecording = useCallback(async () => {
        try {
            setReadyToRecord(false);
            setIsPaused(false);
            pausedUriRef.current = null;
            setRecordingDuration(0);
            setWaveformBars(Array(40).fill(4)); // reset bars

            const newRecording = await _createAndStart();

            setRecording(newRecording);
            recordingRef.current = newRecording;
            setIsRecording(true);

            _startWaveform(newRecording);   // ← ADD
            _startTimer(() => stopAndSendRef.current());
        } catch (error) {
            console.error("Recording start error:", error);
            setIsRecording(false);
            setIsPaused(false);
            setRecording(null);
            recordingRef.current = null;
        }
    }, []);

    const resumeRecording = useCallback(async () => {
        await _stopPreviewSound();
        setRecordingDuration(0);

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            const newRecording = await _createAndStart();

            setRecording(newRecording);
            recordingRef.current = newRecording;
            setIsRecording(true);
            setIsPaused(false);

            _startWaveform(newRecording);   // ← ADD
            _startTimer(() => stopAndSendRef.current());
        } catch (error) {
            console.error("Resume recording error:", error);
        }
    }, []);


    // ─── STEP 3: Pause — stop recording, save URI, switch to isPaused ────────────
    const pauseRecording = useCallback(async () => {
        const uri = await _internalStop();
        if (uri) {
            pausedUriRef.current = uri;
        }
        // Keep duration as-is (don't reset)
        setIsPaused(true);
    }, []);

    // ─── STEP 4: Resume — play back paused clip ──────────────────────────────────
    const playPauseLivePreview = useCallback(async (onProgress?: (progress: number) => void) => {
        const uri = pausedUriRef.current;
        if (!uri) return;

        if (isPlayingPreview && previewSoundRef.current) {
            await _stopPreviewSound();
            return;
        }

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true }
            );

            previewSoundRef.current = sound;
            setIsPlayingPreview(true);

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded) {
                    // ✅ report progress 0→1 to caller
                    if (status.durationMillis) {
                        const progress = status.positionMillis / status.durationMillis;
                        onProgress?.(progress);
                    }

                    if (status.didJustFinish) {
                        setIsPlayingPreview(false);
                        onProgress?.(0); // ✅ reset on finish
                        sound.unloadAsync().catch(() => {});
                        previewSoundRef.current = null;
                    }
                }
            });
        } catch (err) {
            console.error("Live preview error:", err);
            setIsPlayingPreview(false);
        }
    }, [isPlayingPreview]);



    // ─── STEP 6: Stop recording → enter preview ──────────────────────────────────
    const stopRecording = useCallback(async () => {
        const uri = await _internalStop();
        setRecordingDuration(0);
        setWaveformBars(Array(40).fill(4)); // ✅ add this

        // Use latest segment URI, or fall back to paused URI
        const finalUri = uri ?? pausedUriRef.current ?? null;
        pausedUriRef.current = null;

        if (finalUri) {
            setRecordedUri(finalUri);
        }
    }, []);

    // ─── Play / pause final preview ──────────────────────────────────────────────
    const playPreview = useCallback(async () => {
        if (!recordedUri) return;

        if (isPlayingPreview && previewSoundRef.current) {
            await _stopPreviewSound();
            return;
        }

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri: recordedUri },
                { shouldPlay: true }
            );

            previewSoundRef.current = sound;
            setIsPlayingPreview(true);

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlayingPreview(false);
                    sound.unloadAsync().catch(() => {});
                    previewSoundRef.current = null;
                }
            });
        } catch (err) {
            console.error("Preview playback error:", err);
            setIsPlayingPreview(false);
        }
    }, [recordedUri, isPlayingPreview]);

    // ─── Send recorded preview ────────────────────────────────────────────────────
    const sendRecording = useCallback(async () => {
        if (!recordedUri) return;

        await _stopPreviewSound();

        const uri = recordedUri;
        setRecordedUri(null);
        await processAudio(uri, referralRef.current);
    }, [recordedUri, processAudio]);

    // ─── Delete / discard ─────────────────────────────────────────────────────────
    const deleteRecording = useCallback(async () => {
        const current = recordingRef.current;
        if (current) {
            try { await current.stopAndUnloadAsync(); } catch (_) {}
            recordingRef.current = null;
        }

        _stopTimer();
        _stopWaveform();
        await _stopPreviewSound();

        pausedUriRef.current = null;
        setRecordedUri(null);
        setRecording(null);
        setIsRecording(false);
        setIsPaused(false);
        setReadyToRecord(false);
        setRecordingDuration(0);
        referralRef.current = null;
    }, []);



    return {
        recording,
        isRecording,
        isPaused,
        readyToRecord,
        recordedUri,
        isPlayingPreview,
        recordingDuration,
        handleVoiceRecording,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        stopAndSendRecording,
        playPauseLivePreview,
        playPreview,
        sendRecording,
        waveformBars,
        deleteRecording,
    };
}
