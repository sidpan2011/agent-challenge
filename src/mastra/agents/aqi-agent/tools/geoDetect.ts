import { createTool } from "@mastra/core/tools";
import axios from "axios";
import { z } from "zod";

export const geoDetectTool = createTool({
  id: "geo-detect",
  description: "IP-based lat/lon guess (ipapi.co).",
  inputSchema: z.object({}),
  outputSchema: z.object({ lat: z.number(), lon: z.number() }),
  execute: async () => {
    const { data } = await axios.get("https://ipapi.co/json/");
    return { lat: +data.latitude, lon: +data.longitude };
  },
});