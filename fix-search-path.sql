-- Security Fix: Ensure search_path is set for SECURITY DEFINER function
-- Run this in your Supabase SQL Editor to resolve the Advisor Warning!

CREATE OR REPLACE FUNCTION public.handle_property_status_change()
RETURNS TRIGGER 
SET search_path = ''
AS $$
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
