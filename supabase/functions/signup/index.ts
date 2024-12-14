import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SECRET_KEY_SUPABASE") ?? "",
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { email, password, role, first_name, last_name } = await req.json();

    if (!['student', 'admin', 'instructor'].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be 'student', 'admin', or 'instructor'." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (role === 'student' && (!first_name || !last_name)) {
      return new Response(
        JSON.stringify({ error: "First name and last name are required for students." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data, error: dbError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (dbError) {
      console.error("Sign-up error:", dbError);
      throw dbError;
    }

    // Insert user into the 'users' table
    const { error: insertUserError } = await supabase.from('users').insert([
      {
        user_id: data.user?.id,
        email: email,
        role: role,
      },
    ]);

    if (insertUserError) {
      console.error("Insert user error:", insertUserError);
      throw insertUserError;
    }

    // Insert user into the 'students' table
    if (role === 'student') {
      const { error: insertStudentError } = await supabase.from('students').insert([
        {
          user_id: data.user?.id,
          first_name: first_name,
          last_name: last_name,
        },
      ]);

      if (insertStudentError) {
        console.error("Insert student error:", insertStudentError);
        throw insertStudentError;
      }
    }

    return new Response(
      JSON.stringify({ message: "User signed up successfully and added to the database" }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    const errorMessage = (e as Error).message || "An unknown error occurred";
    console.error("Error occurred:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
