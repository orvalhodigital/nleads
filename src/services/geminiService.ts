
import { Lead, Vehicle } from "../types";

export const getMatchingInsights = async (vehicle: Vehicle, qualifiedLeads: Lead[]) => {
  try {
    const response = await fetch('/api/gemini/matching-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicle, qualifiedLeads }),
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.matches ? data : { matches: [] };
  } catch (error) {
    console.error("Gemini Match Error:", error);
    return { matches: [] };
  }
};
