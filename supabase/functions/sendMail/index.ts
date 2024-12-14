import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN");

if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
  throw new Error("MAILGUN_API_KEY or MAILGUN_DOMAIN is not set in the environment.");
}

const mailgunUrl = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  const { email } = await req.json();

  if (!email) {
    return new Response(
      JSON.stringify({ error: "No email provided / Missing email" }),
      { status: 400 },
    );
  }

  const formData = new URLSearchParams();
  formData.append("from", "23104163@usc.edu.ph");
  formData.append("to", email);
  formData.append("subject", "Welcome Email");
  formData.append("text", "Welcome! Please to have you.");

  try {
    const response = await fetch(mailgunUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa("api:" + MAILGUN_API_KEY)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const responseData = await response.json();

    if (response.ok) {
      return new Response(JSON.stringify({ message: "Email sent successfully" }), {
        status: 200,
      });
    } else {
      return new Response(
        JSON.stringify({ error: responseData.message }),
        { status: 500 },
      );
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
});
