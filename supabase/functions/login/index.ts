import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SECRET_KEY_SUPABASE") ?? "",
);

Deno.serve(async (req) => {
    if(req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), 
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try{
    const { email, password } = await req.json();

    if(!email || !password){
      return new Response(
        JSON.stringify({ error: "Email and password are required." }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Invalid login credentials." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: userDetails, error: userError } = await supabase
      .from("users")
      .select("email, role")
      .eq("user_id", data.user?.id)
      .single();

    if (userError) {
      console.error("User details fetch error:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user details." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Login successful",
        user: {
          id: data.user?.id,
          email: userDetails?.email,
          role: userDetails?.role,
        },
        session: data.session,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});