import { createClient } from '@supabase/supabase-js';
//const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rbebhvyklexuhzgcevvb.supabase.co/';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZWJodnlrbGV4dWh6Z2NldnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzNzE5MjcsImV4cCI6MjA0MDk0NzkyN30.jCP4unRhu6OzWLjOioT5PbTSVVGdAd6CmMrP7qx9H0w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

//module.exports = {supabase};

export { supabase }
