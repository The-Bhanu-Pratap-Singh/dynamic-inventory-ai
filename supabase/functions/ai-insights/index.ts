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
    const query = body?.query;
    
    // Input validation
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (query.trim().length === 0 || query.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Query must be between 1 and 500 characters' }),
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

    // Fetch relevant data based on common query patterns
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    const { data: sales, error: salesError } = await supabase
      .from('sales_transactions')
      .select('*, products(name, category, sector)')
      .order('transaction_date', { ascending: false })
      .limit(500);

    if (productsError || salesError) {
      throw new Error('Failed to fetch data from database');
    }

    // Build context for AI
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const recentSales = sales?.filter(s => new Date(s.transaction_date) >= ninetyDaysAgo) || [];
    
    // Calculate stock movement and dead stock
    const productSales = new Map<string, number>();
    recentSales.forEach(sale => {
      const current = productSales.get(sale.product_id) || 0;
      productSales.set(sale.product_id, current + sale.quantity);
    });

    const deadStock = products?.filter(p => !productSales.has(p.id)) || [];
    const lowStock = products?.filter(p => p.current_stock <= p.reorder_level) || [];

    // Category profit analysis
    const categoryRevenue = new Map<string, { revenue: number, cost: number }>();
    recentSales.forEach(sale => {
      const category = sale.products?.category || 'Uncategorized';
      const current = categoryRevenue.get(category) || { revenue: 0, cost: 0 };
      categoryRevenue.set(category, {
        revenue: current.revenue + parseFloat(sale.total_amount),
        cost: current.cost + parseFloat(sale.unit_price) * sale.quantity
      });
    });

    const contextData = {
      totalProducts: products?.length || 0,
      deadStockCount: deadStock.length,
      deadStockItems: deadStock.slice(0, 20).map(p => ({ name: p.name, stock: p.current_stock, category: p.category })),
      lowStockItems: lowStock.slice(0, 10).map(p => ({ name: p.name, stock: p.current_stock, reorderLevel: p.reorder_level })),
      recentSalesCount: recentSales.length,
      categories: Array.from(categoryRevenue.entries()).map(([cat, data]) => ({
        category: cat,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost
      })).sort((a, b) => b.profit - a.profit)
    };

    const systemPrompt = `You are an AI business analyst for an inventory management system. Analyze the data provided and answer queries accurately. Be specific with numbers and provide actionable insights.

Current Database Summary:
- Total Products: ${contextData.totalProducts}
- Dead Stock (no sales in 90 days): ${contextData.deadStockCount} items
- Low Stock Alerts: ${contextData.lowStockItems.length} items
- Recent Sales (90 days): ${contextData.recentSalesCount} transactions

When answering:
1. Use the exact data provided
2. Format numbers clearly with ₹ for currency
3. Provide specific product names and categories
4. Give actionable recommendations
5. If asked about timeframes, reference the 90-day period in the data`;

    const userPrompt = `User Query: "${query}"

Available Data:
${JSON.stringify(contextData, null, 2)}

Provide a clear, actionable answer to the query.`;

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
    const answer = data.choices[0].message.content;

    return new Response(JSON.stringify({ answer, contextData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
