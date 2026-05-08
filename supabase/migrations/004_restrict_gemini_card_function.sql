revoke all on function public.claim_gemini_card() from public;
revoke execute on function public.claim_gemini_card() from anon;
revoke execute on function public.claim_gemini_card() from authenticated;
grant execute on function public.claim_gemini_card() to service_role;
