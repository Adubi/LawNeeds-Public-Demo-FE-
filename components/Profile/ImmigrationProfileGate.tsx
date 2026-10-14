import React, {useCallback, useEffect, useState} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {DeviceEventEmitter} from "react-native";

import ImmigrationProfileSurveyModal from "@/components/Profile/ImmigrationProfileSurveyModal";
import {ProTypes} from "@/constants/protypes";
import {
  PROFILE_COMPLETION_UPDATED_EVENT,
  PROFILE_SURVEY_REQUEST_KEY,
  PROFILE_SURVEY_REQUESTED_EVENT,
} from "@/constants/onboarding";
import UserService from "@/services/UserServices";

const SKIP_PREFIX = "immigration_profile_prompt_skipped_at:";
const SKIP_THROTTLE_MS = 7 * 24 * 60 * 60 * 1000;

const proTypes = [
  ProTypes.LAWYER,
  ProTypes.LAW_FIRM,
  ProTypes.HR_LEGAL,
  "HR/Legal (SME)",
  ProTypes.A2J_PARTNERS,
] as string[];

const shouldRespectSkip = (value: string | null) => {
  if (!value) return false;
  const skippedAt = Number(value);
  return Number.isFinite(skippedAt) && Date.now() - skippedAt < SKIP_THROTTLE_MS;
};

export default function ImmigrationProfileGate() {
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const loadPromptState = useCallback(async (forceOpen = false) => {
    try {
      const requestedFromNotification =
        forceOpen || (await AsyncStorage.getItem(PROFILE_SURVEY_REQUEST_KEY)) === "true";

      if (requestedFromNotification) {
        await AsyncStorage.removeItem(PROFILE_SURVEY_REQUEST_KEY);
      }

      const userType = await AsyncStorage.getItem("user_type");
      if (userType && proTypes.includes(userType)) {
        setVisible(false);
        return;
      }

      const response = await UserService.GetProfile();
      const currentProfile = response?.profile;
      if (!currentProfile) {
        setVisible(false);
        return;
      }

      if (currentProfile.professional_type && proTypes.includes(currentProfile.professional_type)) {
        setVisible(false);
        return;
      }

      setProfile(currentProfile);

      if (currentProfile.immigration_status) {
        setVisible(false);
        return;
      }

      const skippedAt = await AsyncStorage.getItem(`${SKIP_PREFIX}${currentProfile.id}`);
      setVisible(requestedFromNotification || !shouldRespectSkip(skippedAt));
    } catch (error) {
      console.warn("Unable to load immigration profile prompt:", error);
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    loadPromptState();
  }, [loadPromptState]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      PROFILE_SURVEY_REQUESTED_EVENT,
      () => {
        loadPromptState(true).catch((error) => {
          console.warn("Unable to open immigration profile survey:", error);
        });
      },
    );

    return () => subscription.remove();
  }, [loadPromptState]);

  const handleSubmit = async (payload: {immigration_status: string; webinar: boolean}) => {
    if (!profile?.id) return;

    setSaving(true);
    try {
      const response = await UserService.UpdateProfile(payload);
      const updatedProfile = response?.profile ?? {...profile, ...payload};
      setProfile(updatedProfile);
      await AsyncStorage.removeItem(`${SKIP_PREFIX}${profile.id}`);
      DeviceEventEmitter.emit(PROFILE_COMPLETION_UPDATED_EVENT, updatedProfile);
      setVisible(false);
    } catch (error) {
      console.warn("Unable to save immigration profile prompt:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (profile?.id) {
      await AsyncStorage.setItem(`${SKIP_PREFIX}${profile.id}`, String(Date.now()));
    }
    setVisible(false);
  };

  return (
    <ImmigrationProfileSurveyModal
      visible={visible}
      initialImmigrationStatus={profile?.immigration_status ?? ""}
      initialWebinar={typeof profile?.webinar === "boolean" ? profile.webinar : null}
      saving={saving}
      allowSkip
      onSubmit={handleSubmit}
      onSkip={handleSkip}
    />
  );
}
