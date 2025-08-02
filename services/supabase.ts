import { createClient } from '@supabase/supabase-js';

// 4단계: Supabase 클라이언트 설정이 완료되었습니다.
// 제공해주신 anon 키를 사용하여 프로젝트 URL과 키를 설정했습니다.
// 이제 애플리케이션이 Supabase 백엔드와 통신할 준비가 되었습니다.

const supabaseUrl = 'https://vlebkulxcqvmaoysrxao.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsZWJrdWx4Y3F2bWFveXNyeGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDg0MjEsImV4cCI6MjA2OTE4NDQyMX0.2ansO6jf5i92loTsWbeoVn5Z2_ABkCeildC2YHc7Eng';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
