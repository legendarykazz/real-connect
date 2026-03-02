-- ================================================================
-- REALCONNECT - NOTIFICATIONS SYSTEM SETUP
-- Run ALL of this in your Supabase SQL Editor
-- ================================================================

-- STEP 1: Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'approved', 'rejected', 'system'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 2: Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create RLS Policies
-- Users can read their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view/manage all notifications (optional, but good practice)
CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    auth.email() IN ('amjustsam28@gmail.com', 'zephaniahmusa99@gmail.com')
  );

-- STEP 4: Create the Postgres Function (Trigger logic)
CREATE OR REPLACE FUNCTION public.handle_property_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- If approved
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, property_id, title, message, type)
      VALUES (
        NEW.user_id, 
        NEW.id, 
        'Property Approved', 
        'Congratulations! Your listing for ' || NEW.size || ' at ' || NEW.location || ' has been approved and is now live.', 
        'approved'
      );
    -- If rejected
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, property_id, title, message, type)
      VALUES (
        NEW.user_id, 
        NEW.id, 
        'Property Rejected', 
        'Unfortunately, your listing for ' || NEW.size || ' at ' || NEW.location || ' was rejected. Please review our guidelines.', 
        'rejected'
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Attach the Trigger to the properties table
DROP TRIGGER IF EXISTS on_property_status_changed ON public.properties;

CREATE TRIGGER on_property_status_changed
  AFTER UPDATE OF status ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_property_status_change();

-- STEP 6: Enable Realtime for the notifications table so apps can listen instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ================================================================
-- Done! The system will now auto-generate alerts on approve/reject.
-- ================================================================
