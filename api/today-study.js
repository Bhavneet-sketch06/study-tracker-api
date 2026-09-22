// GET /api/today-study
// Returns today's study tasks from Supabase plus a completion summary.
const { createClient } = require('@supabase/supabase-js');

// Credentials come from the environment only -- never written in this file.
// Two names are accepted so the same code works whether you used Supabase's
// default NEXT_PUBLIC_* names or the shorter ones.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The timezone "today" is measured in. Vercel's servers run on UTC, which is
// 5.5 hours behind India -- without this, tasks would look like "yesterday's"
// until 5:30am IST. Change this string if you are in another timezone.
const TIMEZONE = 'Asia/Kolkata';

// supabase-js always builds its realtime client, which needs a WebSocket.
// Node 22+ has one built in; Node 20 does not, so we supply the "ws" package.
// This endpoint never uses realtime -- this just satisfies the requirement.
const clientOptions = {
  realtime: { transport: require('ws') },
};

// Built once per serverless instance and reused while the function stays warm.
const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY, clientOptions) : null;

// 'en-CA' formats dates as YYYY-MM-DD, which is exactly what Postgres wants.
function todayIn(timeZone) {
  return new Date().toLocaleDateString('en-CA', { timeZone });
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!supabase) {
    res.status(500).json({
      error: 'Supabase is not configured. Check SUPABASE_URL and SUPABASE_ANON_KEY.',
    });
    return;
  }

  const today = todayIn(TIMEZONE);

  const { data, error } = await supabase
    .from('study_tasks')
    .select('title, completed')
    .eq('task_date', today)
    .order('created_at', { ascending: true });

  if (error) {
    res.status(500).json({ error: 'Could not load tasks', details: error.message });
    return;
  }

  const tasks = data || [];
  const completed = tasks.filter((task) => task.completed).length;

  res.status(200).json({
    date: today,
    total_tasks: tasks.length,
    completed_tasks: completed,
    pending_tasks: tasks.length - completed,
    tasks,
  });
};
