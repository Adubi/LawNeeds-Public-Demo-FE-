import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background notification received:', remoteMessage);
});

require('expo-router/entry');
