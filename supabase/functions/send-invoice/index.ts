import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  to: string;
  orderNumber: string;
  pdfBase64: string;
  customerName?: string;
  totalAmount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, orderNumber, pdfBase64, customerName, totalAmount } = body;
    
    // Input validation
    if (!to || typeof to !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to) || to.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!orderNumber || typeof orderNumber !== 'string' || orderNumber.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Valid order number is required (max 50 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (customerName && (typeof customerName !== 'string' || customerName.length > 100)) {
      return new Response(
        JSON.stringify({ error: 'Customer name must be less than 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!pdfBase64 || typeof pdfBase64 !== 'string' || pdfBase64.length > 10000000) {
      return new Response(
        JSON.stringify({ error: 'Valid PDF data is required (max 10MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      return new Response(
        JSON.stringify({ error: 'Valid total amount is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "DPI System <onboarding@resend.dev>",
      to: [to],
      subject: `Invoice #${orderNumber} - Dynamic Product Intelligence`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Invoice Generated</h1>
          <p>Dear ${customerName || 'Customer'},</p>
          <p>Thank you for your purchase. Please find your invoice attached.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
          </div>
          <p>If you have any questions, please contact us.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This is an automated email from Dynamic Product Intelligence System.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${orderNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error in send-invoice function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
