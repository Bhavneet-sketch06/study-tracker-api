// POST /api/add-task    body: { "title": "Revise DBMS" }
// Adds one task for today with completed = false.
const { supabase, today, ready } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (!ready(req, res, 'POST')) return;

  // Vercel parses a JSON body for us; guard anyway in case it is missing.
  const body = req.body || {};
  const title = typeof body.title === 'string' ? body.title.trim() : '';

  if (!title) {
    res.status(400).json({ error: 'Task title is required' });
    return;
  }
  if (title.length > 200) {
    res.status(400).json({ error: 'Task title must be 200 characters or fewer' });
    return;
  }

  // .select() makes Supabase return the inserted row, which lets us tell a
  // silent row-level-security block apart from a successful insert.
  const { data, error } = await supabase
    .from('study_tasks')
    .insert({ title, completed: false, task_date: today() })
    .select('id, title, completed, task_date');

  // 42501 is Postgres "insufficient privilege": the table has row-level
  // security on, but no policy allows this insert.
  const blocked = (error && error.code === '42501') || (!error && (!data || data.length === 0));

  if (blocked) {
    res.status(403).json({
      error:
        'Supabase blocked this insert. The study_tasks table needs an INSERT policy for the anon role.',
    });
    return;
  }
  if (error) {
    res.status(500).json({ error: 'Could not add task', details: error.message });
    return;
  }

  res.status(201).json({ success: true, task: data[0] });
};
