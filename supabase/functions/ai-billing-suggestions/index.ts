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
    const { cartItems } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get product IDs from cart
    const productIds = cartItems.map((item: any) => item.productId);

    // Fetch cart products details
    const { data: cartProducts, error: cartError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (cartError) {
      throw new Error('Failed to fetch cart products');
    }

    // Get categories and sector from cart items
    const categories = [...new Set(cartProducts?.map(p => p.category).filter(Boolean))];
    const sector = cartProducts?.[0]?.sector;

    // Fetch potential complementary products
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .not('id', 'in', `(${productIds.join(',')})`)
      .limit(50);

    if (productsError) {
      throw new Error('Failed to fetch products');
    }

    // Fetch recent sales patterns for cross-sell analysis
    const { data: recentSales, error: salesError } = await supabase
      .from('sales_transactions')
      .select('product_id')
      .in('product_id', productIds)
      .order('transaction_date', { ascending: false })
      .limit(100);

    const contextData = {
      cartItems: cartProducts?.map(p => ({
        name: p.name,
        category: p.category,
        price: p.selling_price
      })),
      categories,
      sector,
      availableProducts: allProducts?.slice(0, 20).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.selling_price,
        stock: p.current_stock
      }))
    };

    const systemPrompt = `You are an AI sales assistant for a point-of-sale system. Analyze the customer's cart and suggest relevant upsell and cross-sell products.

Rules:
1. Suggest 3-5 products that complement the items in cart
2. Consider product categories, sector, and typical purchase patterns
3. Prioritize products with good stock availability
4. Provide brief reasons for each suggestion
5. Balance between higher-value upsells and practical cross-sells

Format your response as a JSON array of suggestions with this structure:
[
  {
    "productId": "uuid",
    "productName": "Product Name",
    "reason": "Why this product is relevant",
    "type": "upsell" or "cross-sell"
  }
]`;

    const userPrompt = `Current Cart Analysis:
${JSON.stringify(contextData, null, 2)}

Provide smart product suggestions for upsell and cross-sell opportunities.`;

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
    let suggestions = [];
    
    try {
      const content = data.choices[0].message.content;
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = [];
      }
    } catch (parseError) {
      console.error('Failed to parse suggestions:', parseError);
      suggestions = [];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-billing-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
