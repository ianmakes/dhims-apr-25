
-- Drop all existing policies that might conflict and recreate them
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only authenticated users can insert profiles" ON public.profiles;

-- Drop existing policies for students table
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

-- Drop existing policies for sponsors table
DROP POLICY IF EXISTS "Authenticated users can view sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Authenticated users can insert sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Authenticated users can update sponsors" ON public.sponsors;
DROP POLICY IF EXISTS "Authenticated users can delete sponsors" ON public.sponsors;

-- Drop existing policies for timeline_events table
DROP POLICY IF EXISTS "Authenticated users can view timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Authenticated users can insert timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Authenticated users can update timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Authenticated users can delete timeline events" ON public.timeline_events;

-- Drop existing policies for student_relatives table
DROP POLICY IF EXISTS "Authenticated users can view student relatives" ON public.student_relatives;
DROP POLICY IF EXISTS "Authenticated users can insert student relatives" ON public.student_relatives;
DROP POLICY IF EXISTS "Authenticated users can update student relatives" ON public.student_relatives;
DROP POLICY IF EXISTS "Authenticated users can delete student relatives" ON public.student_relatives;

-- Drop existing policies for student_photos table
DROP POLICY IF EXISTS "Authenticated users can view student photos" ON public.student_photos;
DROP POLICY IF EXISTS "Authenticated users can insert student photos" ON public.student_photos;
DROP POLICY IF EXISTS "Authenticated users can update student photos" ON public.student_photos;
DROP POLICY IF EXISTS "Authenticated users can delete student photos" ON public.student_photos;

-- Drop existing policies for student_letters table
DROP POLICY IF EXISTS "Authenticated users can view student letters" ON public.student_letters;
DROP POLICY IF EXISTS "Authenticated users can insert student letters" ON public.student_letters;
DROP POLICY IF EXISTS "Authenticated users can update student letters" ON public.student_letters;
DROP POLICY IF EXISTS "Authenticated users can delete student letters" ON public.student_letters;

-- Drop existing policies for student_exam_scores table
DROP POLICY IF EXISTS "Authenticated users can view exam scores" ON public.student_exam_scores;
DROP POLICY IF EXISTS "Authenticated users can insert exam scores" ON public.student_exam_scores;
DROP POLICY IF EXISTS "Authenticated users can update exam scores" ON public.student_exam_scores;
DROP POLICY IF EXISTS "Authenticated users can delete exam scores" ON public.student_exam_scores;

-- Drop existing policies for exams table
DROP POLICY IF EXISTS "Authenticated users can view exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can insert exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can update exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can delete exams" ON public.exams;

-- Drop existing policies for academic_years table
DROP POLICY IF EXISTS "Authenticated users can view academic years" ON public.academic_years;
DROP POLICY IF EXISTS "Authenticated users can insert academic years" ON public.academic_years;
DROP POLICY IF EXISTS "Authenticated users can update academic years" ON public.academic_years;
DROP POLICY IF EXISTS "Authenticated users can delete academic years" ON public.academic_years;

-- Drop existing policies for user_roles table
DROP POLICY IF EXISTS "Authenticated users can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Enable RLS on all tables (this is safe to run multiple times)
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_relatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Only authenticated users can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for students table
CREATE POLICY "Authenticated users can view students" ON public.students
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert students" ON public.students
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update students" ON public.students
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete students" ON public.students
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for sponsors table
CREATE POLICY "Authenticated users can view sponsors" ON public.sponsors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert sponsors" ON public.sponsors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update sponsors" ON public.sponsors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete sponsors" ON public.sponsors
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for timeline_events table
CREATE POLICY "Authenticated users can view timeline events" ON public.timeline_events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert timeline events" ON public.timeline_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update timeline events" ON public.timeline_events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete timeline events" ON public.timeline_events
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for student_relatives table
CREATE POLICY "Authenticated users can view student relatives" ON public.student_relatives
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert student relatives" ON public.student_relatives
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update student relatives" ON public.student_relatives
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete student relatives" ON public.student_relatives
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for student_photos table
CREATE POLICY "Authenticated users can view student photos" ON public.student_photos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert student photos" ON public.student_photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update student photos" ON public.student_photos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete student photos" ON public.student_photos
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for student_letters table
CREATE POLICY "Authenticated users can view student letters" ON public.student_letters
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert student letters" ON public.student_letters
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update student letters" ON public.student_letters
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete student letters" ON public.student_letters
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for student_exam_scores table
CREATE POLICY "Authenticated users can view exam scores" ON public.student_exam_scores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert exam scores" ON public.student_exam_scores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exam scores" ON public.student_exam_scores
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exam scores" ON public.student_exam_scores
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for exams table
CREATE POLICY "Authenticated users can view exams" ON public.exams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert exams" ON public.exams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exams" ON public.exams
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exams" ON public.exams
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for academic_years table
CREATE POLICY "Authenticated users can view academic years" ON public.academic_years
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert academic years" ON public.academic_years
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update academic years" ON public.academic_years
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete academic years" ON public.academic_years
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for user_roles table
CREATE POLICY "Authenticated users can view user roles" ON public.user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );
