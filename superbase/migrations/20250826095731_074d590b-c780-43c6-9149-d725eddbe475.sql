-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location TEXT,
  max_participants INTEGER DEFAULT 10
);

-- Create activity participants table
CREATE TABLE public.activity_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- Create messages table for real-time chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_ai_response BOOLEAN DEFAULT FALSE
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for activities
CREATE POLICY "Anyone can view activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Activity creators can update their activities" ON public.activities FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Activity creators can delete their activities" ON public.activities FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for activity participants
CREATE POLICY "Anyone can view activity participants" ON public.activity_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join activities" ON public.activity_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave activities they joined" ON public.activity_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for activities table
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

-- Enable realtime for activity participants table
ALTER TABLE public.activity_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_participants;

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'Traveler_' || substring(NEW.id::text, 1, 8)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();