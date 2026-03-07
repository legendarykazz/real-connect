import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configure your Admin Emails here
const ADMIN_EMAILS = [
    'amjustsam28@gmail.com',
    'zephaniahmusa99@gmail.com'
];

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the Resend API Key securely from Supabase Secrets
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set')
        }

        // Parse the Webhook payload from Supabase
        const payload = await req.json()
        console.log('Incoming Webhook Payload:', JSON.stringify(payload, null, 2))

        const record = payload.record || payload // The newly inserted row data
        const tableName = payload.table || (record.property_type ? 'properties' : (record.id_type ? 'user_verifications' : 'unknown'))

        console.log(`Detected event for table: ${tableName}`);

        let emailSubject = '';
        let emailHtml = '';

        // Check which table triggered the webhook
        if (tableName === 'properties') {
            emailSubject = `🏠 New Property Listing Needs Approval: ${record.location}`;
            emailHtml = `
                <h2>New Property Listing Submitted</h2>
                <p>A new property has been submitted and is waiting for your review.</p>
                <ul>
                    <li><strong>Poster Name:</strong> ${record.first_name || ''} ${record.last_name || ''}</li>
                    <li><strong>Contact Email:</strong> ${record.email}</li>
                    <li><strong>Contact Phone:</strong> ${record.phone}</li>
                    <li><strong>Location:</strong> ${record.location}</li>
                    <li><strong>Type:</strong> ${record.property_type}</li>
                    <li><strong>Price:</strong> ₦${record.price}</li>
                </ul>
                <p>Please log in to the <a href="https://realconnect-platform.vercel.app/admin">Admin Dashboard</a> to review and approve or reject this listing.</p>
            `;
        } else if (tableName === 'user_verifications') {
            emailSubject = `🛡️ RealConnect: New KYC Verification Request`;
            emailHtml = `
                 <h2>New KYC Verification Request</h2>
                 <p>A user has submitted their documents for identity verification.</p>
                 <ul>
                     <li><strong>ID Type:</strong> ${record.id_type}</li>
                     <li><strong>Upload Time:</strong> ${new Date(record.created_at).toLocaleString()}</li>
                 </ul>
                 <p>Please log in to the <a href="https://realconnect-platform.vercel.app/admin">Admin Dashboard</a> to review the submitted documents (ID, Address Proof, Selfie).</p>
             `;
        } else {
            return new Response(JSON.stringify({ message: "Ignored event or unknown table" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Prepare the payload for Resend
        const resendPayload = {
            from: 'RealConnect Admin <onboarding@resend.dev>', // Update this to your verified Resend domain when ready e.g., 'RealConnect <noreply@yourdomain.com>'
            to: ADMIN_EMAILS,
            subject: emailSubject,
            html: emailHtml,
        }

        // Send the email via Resend API
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify(resendPayload),
        })

        const resData = await res.json()

        if (res.ok) {
            console.log('Email sent successfully:', resData)
            return new Response(JSON.stringify(resData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        } else {
            throw new Error(`Resend Error: ${JSON.stringify(resData)}`)
        }

    } catch (error) {
        console.error('Error in edge function:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
