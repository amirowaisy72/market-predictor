/**
 * Central configuration for the dashboard.
 * The prediction engine API will be connected here later (Part 2).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const APP_NAME = "Market Predictor";
export const PREDICTION_HORIZON_MINUTES = 60;
