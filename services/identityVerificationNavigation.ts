import {getIdentityVerificationStatus} from "@/services/identityVerificationGate";

export const identityVerificationDestination = async (): Promise<
  "/(app)/identity-verification" | "/(app)/(tabs)"
> => {
  try {
    const status = await getIdentityVerificationStatus();
    if (status?.required && !status?.approved) {
      return "/(app)/identity-verification";
    }
  } catch (error) {
    console.warn("Unable to load identity verification status:", error);
  }

  return "/(app)/(tabs)";
};
