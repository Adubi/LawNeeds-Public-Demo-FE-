declare module "expo-store-review" {
    export function isAvailableAsync(): Promise<boolean>;
    export function hasAction(): Promise<boolean>;
    export function requestReview(): Promise<void>;
    export function storeUrl(): string | null;
}
