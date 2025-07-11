
-- Function to factory reset all data while preserving superadmin
CREATE OR REPLACE FUNCTION public.factory_reset_all_data(preserve_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all student-related data
  DELETE FROM public.student_exam_scores;
  DELETE FROM public.student_photos;
  DELETE FROM public.student_letters;
  DELETE FROM public.student_relatives;
  DELETE FROM public.timeline_events;
  DELETE FROM public.students;
  
  -- Delete sponsor data
  DELETE FROM public.sponsors;
  
  -- Delete exam data
  DELETE FROM public.exams;
  
  -- Delete academic years
  DELETE FROM public.academic_years;
  
  -- Delete user roles
  DELETE FROM public.user_roles;
  
  -- Delete audit logs
  DELETE FROM public.audit_logs;
  
  -- Delete email settings
  DELETE FROM public.email_settings;
  
  -- Reset app settings to defaults but keep the record
  UPDATE public.app_settings 
  SET 
    organization_name = 'David''s Hope International',
    primary_color = '#9b87f5',
    secondary_color = '#7E69AB',
    theme_mode = 'light',
    footer_text = NULL,
    app_version = NULL,
    logo_url = NULL,
    favicon_url = NULL,
    updated_at = now(),
    updated_by = preserve_user_id
  WHERE id = 'general';
  
  -- Delete all profiles except the preserved user
  DELETE FROM public.profiles WHERE id != preserve_user_id;
  
  -- Create default academic year for current year
  INSERT INTO public.academic_years (year_name, start_date, end_date, is_current, created_by)
  VALUES (
    EXTRACT(YEAR FROM CURRENT_DATE)::text,
    (EXTRACT(YEAR FROM CURRENT_DATE)::text || '-01-01')::date,
    (EXTRACT(YEAR FROM CURRENT_DATE)::text || '-12-31')::date,
    true,
    preserve_user_id
  );
  
  -- Log the factory reset
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, details)
  VALUES (
    preserve_user_id,
    'factory_reset',
    'system',
    'all',
    'Complete factory reset performed'
  );
END;
$$;

-- Function to backup all data
CREATE OR REPLACE FUNCTION public.backup_all_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backup_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'students', (SELECT jsonb_agg(to_jsonb(s)) FROM public.students s),
    'sponsors', (SELECT jsonb_agg(to_jsonb(s)) FROM public.sponsors s),
    'exams', (SELECT jsonb_agg(to_jsonb(e)) FROM public.exams e),
    'student_exam_scores', (SELECT jsonb_agg(to_jsonb(ses)) FROM public.student_exam_scores ses),
    'student_photos', (SELECT jsonb_agg(to_jsonb(sp)) FROM public.student_photos sp),
    'student_letters', (SELECT jsonb_agg(to_jsonb(sl)) FROM public.student_letters sl),
    'student_relatives', (SELECT jsonb_agg(to_jsonb(sr)) FROM public.student_relatives sr),
    'timeline_events', (SELECT jsonb_agg(to_jsonb(te)) FROM public.timeline_events te),
    'academic_years', (SELECT jsonb_agg(to_jsonb(ay)) FROM public.academic_years ay),
    'profiles', (SELECT jsonb_agg(to_jsonb(p)) FROM public.profiles p),
    'user_roles', (SELECT jsonb_agg(to_jsonb(ur)) FROM public.user_roles ur),
    'app_settings', (SELECT jsonb_agg(to_jsonb(as_table)) FROM public.app_settings as_table),
    'email_settings', (SELECT jsonb_agg(to_jsonb(es)) FROM public.email_settings es),
    'audit_logs', (SELECT jsonb_agg(to_jsonb(al)) FROM public.audit_logs al)
  ) INTO backup_data;
  
  RETURN backup_data;
END;
$$;

-- Function to restore all data from backup
CREATE OR REPLACE FUNCTION public.restore_all_data(backup_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_data jsonb;
  temp_record record;
BEGIN
  -- Get current user for audit
  DECLARE current_user_id UUID := auth.uid();
  
  -- Clear existing data first (except current user)
  PERFORM public.factory_reset_all_data(current_user_id);
  
  -- Restore students
  IF backup_data ? 'students' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'students')
    LOOP
      INSERT INTO public.students SELECT * FROM jsonb_populate_record(null::public.students, record_data);
    END LOOP;
  END IF;
  
  -- Restore sponsors
  IF backup_data ? 'sponsors' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'sponsors')
    LOOP
      INSERT INTO public.sponsors SELECT * FROM jsonb_populate_record(null::public.sponsors, record_data);
    END LOOP;
  END IF;
  
  -- Restore exams
  IF backup_data ? 'exams' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'exams')
    LOOP
      INSERT INTO public.exams SELECT * FROM jsonb_populate_record(null::public.exams, record_data);
    END LOOP;
  END IF;
  
  -- Restore student exam scores
  IF backup_data ? 'student_exam_scores' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'student_exam_scores')
    LOOP
      INSERT INTO public.student_exam_scores SELECT * FROM jsonb_populate_record(null::public.student_exam_scores, record_data);
    END LOOP;
  END IF;
  
  -- Restore student photos
  IF backup_data ? 'student_photos' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'student_photos')
    LOOP
      INSERT INTO public.student_photos SELECT * FROM jsonb_populate_record(null::public.student_photos, record_data);
    END LOOP;
  END IF;
  
  -- Restore student letters
  IF backup_data ? 'student_letters' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'student_letters')
    LOOP
      INSERT INTO public.student_letters SELECT * FROM jsonb_populate_record(null::public.student_letters, record_data);
    END LOOP;
  END IF;
  
  -- Restore student relatives
  IF backup_data ? 'student_relatives' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'student_relatives')
    LOOP
      INSERT INTO public.student_relatives SELECT * FROM jsonb_populate_record(null::public.student_relatives, record_data);
    END LOOP;
  END IF;
  
  -- Restore timeline events
  IF backup_data ? 'timeline_events' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'timeline_events')
    LOOP
      INSERT INTO public.timeline_events SELECT * FROM jsonb_populate_record(null::public.timeline_events, record_data);
    END LOOP;
  END IF;
  
  -- Restore academic years (delete default first)
  IF backup_data ? 'academic_years' THEN
    DELETE FROM public.academic_years;
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'academic_years')
    LOOP
      INSERT INTO public.academic_years SELECT * FROM jsonb_populate_record(null::public.academic_years, record_data);
    END LOOP;
  END IF;
  
  -- Restore profiles (except current user)
  IF backup_data ? 'profiles' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'profiles')
    LOOP
      IF (record_data->>'id')::uuid != current_user_id THEN
        INSERT INTO public.profiles SELECT * FROM jsonb_populate_record(null::public.profiles, record_data);
      END IF;
    END LOOP;
  END IF;
  
  -- Restore user roles
  IF backup_data ? 'user_roles' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'user_roles')
    LOOP
      INSERT INTO public.user_roles SELECT * FROM jsonb_populate_record(null::public.user_roles, record_data);
    END LOOP;
  END IF;
  
  -- Restore app settings
  IF backup_data ? 'app_settings' THEN
    DELETE FROM public.app_settings;
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'app_settings')
    LOOP
      INSERT INTO public.app_settings SELECT * FROM jsonb_populate_record(null::public.app_settings, record_data);
    END LOOP;
  END IF;
  
  -- Restore email settings
  IF backup_data ? 'email_settings' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'email_settings')
    LOOP
      INSERT INTO public.email_settings SELECT * FROM jsonb_populate_record(null::public.email_settings, record_data);
    END LOOP;
  END IF;
  
  -- Restore audit logs
  IF backup_data ? 'audit_logs' THEN
    FOR record_data IN SELECT jsonb_array_elements(backup_data->'audit_logs')
    LOOP
      INSERT INTO public.audit_logs SELECT * FROM jsonb_populate_record(null::public.audit_logs, record_data);
    END LOOP;
  END IF;
  
  -- Log the restore operation
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, details)
  VALUES (
    current_user_id,
    'data_restore',
    'system',
    'all',
    'Complete data restore performed'
  );
END;
$$;
