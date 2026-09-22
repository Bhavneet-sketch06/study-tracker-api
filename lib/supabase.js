// Shared Supabase connection, used by the newer API endpoints.
// It lives outside the api/ folder on purpose, so Vercel does not
// mistake it for an endpoint of its own.
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Same timezone choice as api/today-study.js: Vercel runs on UTC, which is
// 5.5 hours behind India, so "today" must be pinned to IST.
const TIMEZONE = 'Asia/Kolkata';

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        // Node 20 has no built-in WebSocket; supabase-js needs one at startup.
        realtime: { transport: require('ws') },
      })
    : null;

// 'en-CA' gives YYYY-MM-DD, the format Postgres expects for a date column.
function today() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

// Every endpoint starts the same way: reject the wrong method, and make sure
// the database is actually configured. Returns true if the request may proceed.
function ready(req, res, method) {
  if (req.method !== method) {
    res.setHeader('Allow', method);
    res.status(405).json({ error: 'Method Not Allowed' });
    return false;
  }
  if (!supabase) {
    res.status(500).json({ error: 'Supabase is not configured.' });
    return false;
  }
  return true;
}

module.exports = { supabase, today, ready };
