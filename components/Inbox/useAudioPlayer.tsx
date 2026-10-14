import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';

const useAudioPlayer = () => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingUri, setPlayingUri] = useState<string | null>(null);

    const playPauseSound = async (url: string) => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            // Same URI — toggle pause/play
            if (playingUri === url) {
                if (sound) {
                    await sound.pauseAsync();
                    setPlayingUri(null);
                }
                return;
            }

            // Different URI — unload previous and play new
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
                setPlayingUri(null);
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );
            setSound(newSound);
            setPlayingUri(url);

            newSound.setOnPlaybackStatusUpdate(status => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingUri(null);
                    newSound.unloadAsync();
                    setSound(null);
                }
            });

        } catch (error) {
            console.error('Audio error:', error);
        }
    };

    const isPlaying = (uri: string) => playingUri === uri;

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    return { playPauseSound, isPlaying };
};

export default useAudioPlayer;