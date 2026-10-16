/* CarWise — Supabase client configuration.
   Loaded on every page before all other JS.
   The anon key is safe to expose in client-side code —
   Row Level Security policies protect the data. */

const SUPABASE_URL = 'https://rubwcjgkyawfgyftwotu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YndjamdreWF3Zmd5ZnR3b3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMTk5ODMsImV4cCI6MjEwNzY5NTk4M30.f9aKvctERKswp_cO6I2JYYb8YJk7-47bqkezB1LkbY8';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Razorpay Test Key:
   Replace with your own Key ID (starts with rzp_test_...) from https://dashboard.razorpay.com/app/keys
   If left blank or with placeholder, the built-in Sandbox Payment Simulator will run seamlessly! */
const RAZORPAY_KEY_ID = 'rzp_test_51MockDemoKey';
