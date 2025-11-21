import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const productId = body?.productId;
    
    // Input validation
    if (!productId || typeof productId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Product ID is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid product ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Fetch sales history for this product
    const { data: sales, error: salesError } = await supabase
      .from('sales_transactions')
      .select('*')
      .eq('product_id', productId)
      .order('transaction_date', { ascending: false })
      .limit(100);

    if (salesError) {
      throw new Error('Failed to fetch sales data');
    }

    // Calculate sales trends
    const now = new Date();
    const last30Days = sales?.filter(s => 
      new Date(s.transaction_date) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    ) || [];
    const last60Days = sales?.filter(s => 
      new Date(s.transaction_date) >= new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    ) || [];
    const last90Days = sales?.filter(s => 
      new Date(s.transaction_date) >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    ) || [];

    const totalSold30 = last30Days.reduce((sum, s) => sum + s.quantity, 0);
    const totalSold60 = last60Days.reduce((sum, s) => sum + s.quantity, 0);
    const totalSold90 = last90Days.reduce((sum, s) => sum + s.quantity, 0);

    const avgDaily30 = totalSold30 / 30;
    const avgDaily60 = totalSold60 / 60;
    const avgDaily90 = totalSold90 / 90;

    const contextData = {
      productName: product.name,
      category: product.category,
      sector: product.sector,
      currentStock: product.current_stock,
      reorderLevel: product.reorder_level,
      salesLast30Days: totalSold30,
      salesLast60Days: totalSold60,
      salesLast90Days: totalSold90,
      avgDailySales30: avgDaily30.toFixed(2),
      avgDailySales60: avgDaily60.toFixed(2),
      avgDailySales90: avgDaily90.toFixed(2),
      totalTransactions: sales?.length || 0
    };

    const systemPrompt = `You are a demand forecasting AI for an inventory management system. Analyze sales patterns and provide accurate reorder recommendations.

Your analysis should include:
1. Demand trend (increasing, stable, or declining)
2. Recommended reorder quantity for the next 30 days
3. Suggested reorder point
4. Risk assessment (stock-out risk, overstocking risk)
5. Seasonality considerations if evident

Be specific with numbers and provide clear reasoning.`;

    const userPrompt = `Analyze the following product data and provide a demand forecast:

${JSON.stringify(contextData, null, 2)}

Provide:
1. Demand Trend Analysis
2. Recommended Reorder Quantity (next 30 days)
3. Optimal Reorder Point
4. Risk Assessment
5. Additional Recommendations`;

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
    const forecast = data.choices[0].message.content;

    return new Response(JSON.stringify({ forecast, contextData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-demand-forecast:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
