import client from "./client";

export const getPublicMarketingPixels = () => client.get("/marketing/pixels");
