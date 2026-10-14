let currentRouteName: string | null = null;
let currentParams: any = {};

export const setCurrentRoute = (name: string, params: any) => {
    currentRouteName = name;
    currentParams = params;
};

export const getCurrentRoute = () => ({
    name: currentRouteName,
    params: currentParams,
});