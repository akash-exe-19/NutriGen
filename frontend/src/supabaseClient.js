import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltgymsmxmsxylpdcqvzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Z3ltc214bXN4eWxwZGNxdnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzcxOTgsImV4cCI6MjA5MjAxMzE5OH0.QhgSnWM2E7Sr8oaHoYweggeJi1ujLJUBfWctokiuQNs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);