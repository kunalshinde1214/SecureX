import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, reportUrl, score, targetUrl } = await req.json();

    if (!email || !reportUrl || score === undefined || !targetUrl) {
      return NextResponse.json(
        { error: "Missing required fields: email, reportUrl, score, targetUrl" },
        { status: 400 }
      );
    }

    // Determine score color/status for the email
    const isGood = score >= 80;
    const isWarning = score >= 60 && score < 80;
    const scoreColor = isGood ? "#10b981" : isWarning ? "#fbbf24" : "#ef4444";
    const statusText = isGood ? "Excellent" : isWarning ? "Needs Attention" : "Critical Vulnerabilities";

    const data = await resend.emails.send({
      from: "SecureX Reports <onboarding@resend.dev>", // using Resend's test domain for now, since we have a free API key
      to: email,
      subject: `[SecureX] Security Audit Report for ${targetUrl}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 0; color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            
            <!-- Header -->
            <div style="background-color: #0ea5e9; padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">SecureX</h1>
              <p style="color: #e0f2fe; margin: 8px 0 0 0; font-size: 16px;">Automated Security Audit Report</p>
            </div>

            <!-- Body -->
            <div style="padding: 40px 32px;">
              <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">
                Your security audit for <strong>${targetUrl}</strong> has been completed.
              </p>

              <!-- Score Card -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0;">
                <p style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Overall Security Score</p>
                <div style="font-size: 48px; font-weight: 900; color: ${scoreColor}; line-height: 1;">
                  ${score}<span style="font-size: 24px;">/100</span>
                </div>
                <p style="font-size: 16px; font-weight: 600; color: #334155; margin: 12px 0 0 0;">
                  Status: ${statusText}
                </p>
              </div>

              <p style="font-size: 16px; line-height: 1.6;">
                We have uncovered actionable insights regarding your site's SSL configuration, security headers, potential OWASP vulnerabilities, and core performance vitals.
              </p>

              <div style="text-align: center; margin-top: 40px;">
                <a href="${reportUrl}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 28px; border-radius: 8px;">
                  View Full Detailed Report
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 13px; color: #64748b; margin: 0;">
                © ${new Date().getFullYear()} SecureX Platform.<br>
                This is an automated notification.
              </p>
            </div>

          </div>
        </div>
      `,
    });

    if (data.error) {
      console.error("Resend API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Email Sending Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while sending the email." },
      { status: 500 }
    );
  }
}
