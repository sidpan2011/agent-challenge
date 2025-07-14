// src/mastra/tools/fetchAir.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios from "axios";

/* ---------- EPA break-points (µg/m³ or ppb → AQI) ---------- */
const BP = {
  pm25: [
    { cL: 0.0,  cH: 12.0,  aL: 0,  aH: 50 },
    { cL: 12.1, cH: 35.4,  aL: 51, aH: 100 },
    { cL: 35.5, cH: 55.4,  aL: 101,aH: 150 },
    { cL: 55.5, cH: 150.4, aL: 151,aH: 200 },
    { cL: 150.5,cH: 250.4, aL: 201,aH: 300 },
    { cL: 250.5,cH: 350.4, aL: 301,aH: 400 },
    { cL: 350.5,cH: 500.4, aL: 401,aH: 500 },
  ],
  pm10: [
    { cL: 0,   cH: 54,    aL: 0,  aH: 50 },
    { cL: 55,  cH: 154,   aL: 51, aH: 100 },
    { cL: 155, cH: 254,   aL: 101,aH: 150 },
    { cL: 255, cH: 354,   aL: 151,aH: 200 },
    { cL: 355, cH: 424,   aL: 201,aH: 300 },
    { cL: 425, cH: 504,   aL: 301,aH: 400 },
    { cL: 505, cH: 604,   aL: 401,aH: 500 },
  ],
  /* simplified demo tables */
  o3: [
    { cL: 0,  cH: 54,  aL: 0,  aH: 50 },
    { cL: 55, cH: 70,  aL: 51, aH: 100 },
    { cL: 71, cH: 85,  aL: 101,aH: 150 },
    { cL: 86, cH: 105, aL: 151,aH: 200 },
    { cL: 106,cH: 200, aL: 201,aH: 300 },
    { cL: 201,cH: 604, aL: 301,aH: 500 },
  ],
  no2: [
    { cL: 0,   cH: 53,   aL: 0,  aH: 50 },
    { cL: 54,  cH: 100,  aL: 51, aH: 100 },
    { cL: 101, cH: 360,  aL: 101,aH: 150 },
    { cL: 361, cH: 649,  aL: 151,aH: 200 },
    { cL: 650, cH: 1249, aL: 201,aH: 300 },
    { cL: 1250,cH: 2049, aL: 301,aH: 400 },
    { cL: 2050,cH: 3049, aL: 401,aH: 500 },
  ],
} as const;

function toAQI(type: keyof typeof BP, conc: number) {
  const bp = BP[type].find(b => conc >= b.cL && conc <= b.cH) ?? BP[type].at(-1)!;
  return Math.round(((bp.aH - bp.aL) / (bp.cH - bp.cL)) * (conc - bp.cL) + bp.aL);
}

export const fetchAQI = createTool({
  id: "fetch-aqi",
  description: "Return latest AQI for PM2.5, PM10, O3, NO2.",
  inputSchema: z.object({
    lat: z.number().describe("Latitude"),
    lon: z.number().describe("Longitude"),
  }),
  outputSchema: z.object({
    pm25: z.number(), pm10: z.number(), o3: z.number(), no2: z.number(), aqi_max: z.number(),
  }),

  execute: async ({ context: { lat, lon } }) => {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality` +
                `?latitude=${lat}&longitude=${lon}` +
                `&hourly=pm2_5,pm10,ozone,nitrogen_dioxide`;
    const { data } = await axios.get(url);
    const grab = (arr: (number|null)[]) => [...arr].reverse().find(v => v!=null) ?? 0;

    const pm25 = toAQI("pm25", grab(data.hourly.pm2_5));
    const pm10 = toAQI("pm10", grab(data.hourly.pm10));
    const o3   = toAQI("o3",   grab(data.hourly.ozone));
    const no2  = toAQI("no2",  grab(data.hourly.nitrogen_dioxide));

    const aqi_max = Math.max(pm25, pm10, o3, no2);
    return { pm25, pm10, o3, no2, aqi_max };
  },
});