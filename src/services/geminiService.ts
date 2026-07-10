
import { Lead, Vehicle } from "../types";
import { supabase } from "../lib/supabaseClient";

export const getMatchingInsights = async (vehicle: Vehicle, qualifiedLeads: Lead[]) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/gemini/matching-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
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

export const generateSeoDetails = async (vehicle: Partial<Vehicle>): Promise<{ seoHeadline: string; seoDescription: string; suggestedSalePrice: number }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/gemini/generate-seo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify({ vehicle }),
    });

    if (!response.ok) {
      throw new Error(`SEO request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Gemini SEO Generation Error:", error);
    return { seoHeadline: '', seoDescription: '', suggestedSalePrice: 0 };
  }
};
