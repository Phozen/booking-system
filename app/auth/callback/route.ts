import { NextResponse, type NextRequest } from "next/server";

import { getPostLoginPath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const origin = requestUrl.origin;

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=microsoft`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }

  try {
    const supabase = await createClient();
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=callback`);
    }

    const redirectTo = await getPostLoginPath(supabase, data.user);
    return NextResponse.redirect(`${origin}${redirectTo}`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }
}
