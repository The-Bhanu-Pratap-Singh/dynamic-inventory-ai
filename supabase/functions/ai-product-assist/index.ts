import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, productName, category, sector, costPrice } = body;
    
    // Input validation
    if (!action || typeof action !== 'string' || !['generate_description', 'estimate_price'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be generate_description or estimate_price' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!productName || typeof productName !== 'string' || productName.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Product name is required and must be less than 200 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (category && (typeof category !== 'string' || category.length > 100)) {
      return new Response(
        JSON.stringify({ error: 'Category must be less than 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (sector && (typeof sector !== 'string' || sector.length > 100)) {
      return new Response(
        JSON.stringify({ error: 'Sector must be less than 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'estimate_price') {
      if (!costPrice || typeof costPrice !== 'number' || costPrice <= 0) {
        return new Response(
          JSON.stringify({ error: 'Valid cost price is required for price estimation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'generate_description') {
      systemPrompt = 'You are an expert product copywriter. Generate compelling, professional product descriptions that highlight key features and benefits.';
      userPrompt = `Generate a detailed product description for:\nProduct Name: ${productName}\nCategory: ${category || 'General'}\nBusiness Sector: ${sector || 'Retail'}\n\nProvide a clear, engaging description in 2-3 sentences.`;
    } else if (action === 'estimate_price') {
      systemPrompt = 'You are a pricing analyst. Estimate reasonable selling prices based on cost price, considering standard markup rates for different business sectors.';
      userPrompt = `Estimate the selling price for:\nProduct Name: ${productName}\nCategory: ${category || 'General'}\nBusiness Sector: ${sector || 'Retail'}\nCost Price: ₹${costPrice}\n\nProvide ONLY a numeric value for the estimated selling price. Consider typical markup percentages: Retail (30-50%), Pharma (15-20%), Electronics (20-30%), Food (40-60%).`;
    } else {
      throw new Error('Invalid action specified');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-product-assist:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
