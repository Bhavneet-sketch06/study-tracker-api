// GET /api/tasks
// Same rows as /api/today-study, but includes each task's id so the page
// can mark a specific task complete. today-study stays unchanged.
const { supabase, today, ready } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (!ready(req, res, 'GET')) return;

  const { data, error } = await supabase
    .from('study_tasks')
    .select('id, title, completed')
    .eq('task_date', today())
    // Rows inserted by one INSERT share a created_at, and tied rows come back
    // in an arbitrary order that can change after an update. Sorting by id as
    // well keeps the on-screen list from shuffling.
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    res.status(500).json({ error: 'Could not load tasks', details: error.message });
    return;
  }

  res.status(200).json({ date: today(), tasks: data || [] });
};
