// services/planToRevenueCat.ts
import Purchases, {PurchasesPackage} from 'react-native-purchases';

export function planIdVariants(id: string, tier?: string) {
    const variants = [
        id,
        id.replace(/-/g, '_'),
        id.replace(/_/g, '-'),
    ];

    if (tier === "express" || id.replace(/[-_]/g, "").toLowerCase().includes("expressdaily")) {
        variants.push(
            "daily_pass",
            "daily-pass",
            "express_daily",
            "express-daily",
            "express_daily_android",
            "express-daily-android",
            "express_daily_ios",
            "express-daily-ios",
        );
    }

    return Array.from(new Set(variants.filter(Boolean)));
}

export function comparableId(id?: string | null) {
    return id?.replace(/[-_]/g, '').toLowerCase() ?? "";
}

export function idMatchesPlan(value: string | null | undefined, variants: string[]) {
    if (!value) return false;

    const comparableVariants = variants.map(comparableId);
    const valueParts = [value, value.split(':').pop() ?? value];

    return valueParts.some((part) => (
        variants.includes(part) ||
        comparableVariants.includes(comparableId(part))
    ));
}

export function findRevenueCatPackageForPlan(
    availablePackages: PurchasesPackage[] = [],
    selectedId: string,
    tier?: string,
): PurchasesPackage | null {
    const variants = planIdVariants(selectedId, tier);

    return availablePackages.find(p => {
        const product = p.product as any;
        return (
            idMatchesPlan(p.identifier, variants) ||
            idMatchesPlan(product.identifier, variants) ||
            product.subscriptionOptions?.some(
                (opt: any) => idMatchesPlan(opt.storeProductId, variants)
            ) ||
            product.subscriptionOptions?.some(
                (opt: any) => idMatchesPlan(opt.id, variants)
            )
        );
    }) ?? null;
}

export function applyRevenueCatPriceToPlan<T extends {
    id: string;
    tier?: string;
    price_gbp: number;
    isDiscount?: boolean;
    currencyCode?: string;
    displayPrice?: string;
    first_month_price_gbp?: number | null;
    first_month_display_price?: string | null;
    first_month_discount_percent?: number | null;
}>(
    plan: T,
    availablePackages: PurchasesPackage[] = [],
): T {
    const rcMatch = findRevenueCatPackageForPlan(availablePackages, plan.id, plan.tier);
    if (!rcMatch) return {...plan};

    const rcProduct = rcMatch.product as any;
    const basePrice = Number(rcProduct.price?.toFixed?.(2) ?? rcProduct.price);
    const updatedPlan = {
        ...plan,
        price_gbp: Number.isFinite(basePrice) ? basePrice : plan.price_gbp,
        displayPrice: rcProduct.priceString || plan.displayPrice,
        isDiscount: false,
        currencyCode: rcProduct.currencyCode || plan.currencyCode,
    };

    let introPrice: number | null = null;
    let introDisplayPrice: string | null = null;

    if (rcProduct.introPrice?.price) {
        introPrice = Number(rcProduct.introPrice.price.toFixed(2));
        introDisplayPrice = rcProduct.introPrice.priceString || null;
    }

    if (!introPrice && rcProduct.subscriptionOptions?.length) {
        const introPhase = rcProduct.subscriptionOptions
            .flatMap((opt: any) => opt.pricingPhases?.pricingPhaseList || [])
            .find((phase: any) => phase.priceAmountMicros && phase.billingPeriod);
        if (introPhase) {
            introPrice = Number((introPhase.priceAmountMicros / 1000000).toFixed(2));
            introDisplayPrice = introPhase.formattedPrice || introPhase.priceString || null;
        }
    }

    if (introPrice && introPrice < updatedPlan.price_gbp) {
        return {
            ...updatedPlan,
            first_month_price_gbp: introPrice,
            first_month_display_price: introDisplayPrice,
            first_month_discount_percent: Math.round((1 - introPrice / updatedPlan.price_gbp) * 100),
            isDiscount: true,
        };
    }

    return updatedPlan;
}

export async function getRevenueCatPackage(
    selectedId: string
): Promise<PurchasesPackage | null> {

    try {
        const offerings = await Purchases.getOfferings();

        const offering = offerings.current ?? offerings.all["default"] ?? Object.values(offerings.all)[0];

        if (!offering) {
            console.warn('[RC] No offering available');
            return null;
        }

        const pkg = findRevenueCatPackageForPlan(offering.availablePackages, selectedId);

        if (!pkg) {
            console.warn('[RC] Package not found for product:', selectedId);
            console.warn(
                '[RC] Available products:',
                offering.availablePackages.map(p => ({
                    packageId: p.identifier,
                    productId: p.product.identifier,
                    subscriptionOptionIds: (p.product as any).subscriptionOptions?.map((opt: any) => opt.id),
                    storeProductIds: (p.product as any).subscriptionOptions?.map((opt: any) => opt.storeProductId),
                }))
            );
            return null;
        }

        return pkg;

    } catch (e) {
        console.error('[RC] getRevenueCatPackage failed:', e);
        return null;
    }
}
