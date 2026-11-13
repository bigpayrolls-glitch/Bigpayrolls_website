// Supabase Edge Function: POST { id } after a website enquiry is saved -> team email + WhatsApp.
// Deployed by .github/workflows/deploy.yml (public endpoint, no Supabase login needed).
import { handle } from './handler.ts';

Deno.serve((req) => handle(req, Deno.env.toObject()));
