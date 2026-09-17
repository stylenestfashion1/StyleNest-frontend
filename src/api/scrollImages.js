import client from "./client";

export const getScrollImages = (gender) => client.get("/scroll-images", { params: { gender } });
