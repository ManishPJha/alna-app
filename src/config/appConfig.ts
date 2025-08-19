export const appConfig = {
    environment: process.env.NODE_ENV,
    appBaseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    isProduction: process.env.NODE_ENV === "production",
};


export const authConfig = {
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",  
};
