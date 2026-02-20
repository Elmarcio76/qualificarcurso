-- Fix course_videos policies: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admin manage videos" ON course_videos;
DROP POLICY IF EXISTS "Enrolled users read videos" ON course_videos;

CREATE POLICY "Admin manage videos" ON course_videos FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled users read videos" ON course_videos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = course_videos.course_id
    AND enrollments.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix course_files policies: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admin manage files" ON course_files;
DROP POLICY IF EXISTS "Enrolled users read files" ON course_files;

CREATE POLICY "Admin manage files" ON course_files FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled users read files" ON course_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = course_files.course_id
    AND enrollments.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also fix other restrictive policies that could cause similar issues
DROP POLICY IF EXISTS "Anyone can read courses" ON courses;
CREATE POLICY "Anyone can read courses" ON courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage courses" ON courses;
CREATE POLICY "Admin manage courses" ON courses FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users read own enrollments" ON enrollments;
CREATE POLICY "Users read own enrollments" ON enrollments FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "System insert enrollments" ON enrollments;
CREATE POLICY "System insert enrollments" ON enrollments FOR INSERT
WITH CHECK (auth.uid() = user_id);