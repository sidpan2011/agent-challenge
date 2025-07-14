import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const forecastAQI = createTool({
  id: "forecast-aqi",
  description: "Project next-3-hour AQI from today's AQI.",
  inputSchema: z.object({
    aqi: z.number().describe("Current PM2.5 AQI"),
  }),
  outputSchema: z.object({
    forecast: z.number().describe("Projected PM2.5 AQI over the next 3 h"),
  }),
  execute: async ({ context }) => ({
    forecast: +(context.aqi * 1.1).toFixed(2),   // simple 10 % bump
  }),
});