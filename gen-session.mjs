import { createServerClient } from "@supabase/ssr";

const URL = "http://127.0.0.1:54321";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const store = new Map();
const supabase = createServerClient(URL, ANON, {
  cookies: {
    getAll() {
      return [...store.entries()].map(([name, value]) => ({ name, value }));
    },
    setAll(list) {
      for (const { name, value } of list) store.set(name, value);
    },
  },
});

const { data, error } = await supabase.auth.signInWithPassword({
  email: "superadmin@qbook.test",
  password: "Password123!",
});

if (error) {
  console.error("SIGNIN_ERROR", error.message);
  process.exit(1);
}
console.error("signed in as", data.user?.email, "provider:", data.user?.app_metadata?.provider);

const cookies = [...store.entries()].map(([name, value]) => ({ name, value }));
console.log(JSON.stringify(cookies));
