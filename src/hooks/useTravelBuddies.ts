import { useQuery } from "@tanstack/react-query";
// Import the Supabase hook you are already using
import { useSupabase } from './useSupabase'; 

// --- Type Definitions (MUST match your database structure) ---

// Interface for the detailed Profile data retrieved via the JOIN
export interface ProfileDetails {
    user_id: string; 
    username: string | null; 
    rating: number | null;
    trips: number | null;
    // Note: If interests is stored as JSON in the DB, it should be parsed to string[]
    interests: string[] | string | null; 
    bio: string | null;
    avatar_url: string | null; 
    looking_for: string | null; 
    next_trip: string | null;   
}

// Interface for the relationship row, containing both user's profile details
interface BuddyRelationship {
    id: string; 
    status: 'accepted' | 'pending' | 'rejected';
    user_id_1: string; 
    user_id_2: string; 
    
    // Using clearer aliases for joined data
    user1_profile: ProfileDetails; 
    user2_profile: ProfileDetails;
}

// --- Data Fetching Function ---

// The fetcher needs the supabase client instance (which we get from useSupabase)
const fetchTravelBuddies = async (supabase: any, currentUserId: string): Promise<ProfileDetails[]> => {
    
    // Fields to select from the joined 'profiles' table
    const profileFields = `user_id, username, rating, trips, interests, bio, avatar_url, looking_for, next_trip`;

    const selectString = `
        id,
        status,
        user_id_1,
        user_id_2,
        user1_profile:profiles!user_id_1(${profileFields}),
        user2_profile:profiles!user_id_2(${profileFields})
    `;
    
    // Query the 'travel_buddies' table
    const { data, error } = await supabase
        .from('travel_buddies')
        .select(selectString) 
        .eq('status', 'accepted')
        .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

    if (error) {
        console.error("Supabase Buddy Fetch Error:", error.message);
        throw new Error(`Supabase Query failed. Details: ${error.message}`);
    }
    
    // Cast the returned data to the relationship type
    const acceptedRelationships = (data as unknown as BuddyRelationship[]) ?? [];

    // Extract the profile of the *other* user (not the current user)
    const buddyProfiles: ProfileDetails[] = acceptedRelationships.map((relationship) => {
        if (relationship.user1_profile.user_id === currentUserId) {
            return relationship.user2_profile;
        } else {
            return relationship.user1_profile;
        }
    }).filter((profile): profile is ProfileDetails => !!profile); 

    // Sort the profiles by rating client-side
    return buddyProfiles.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
};

// --- Custom Hook (THIS IS THE EXPORT) ---

/**
 * Custom hook to fetch the current user's accepted travel buddies.
 * @param {string | undefined} userId - The ID of the current authenticated user.
 * @returns The useQuery result object.
 */
export const useTravelBuddies = (userId: string | undefined) => {
    const supabase = useSupabase(); // Get the client instance
    
    return useQuery<ProfileDetails[], Error>({
        queryKey: ['travelBuddies', userId],
        // The queryFn now requires the supabase client
        queryFn: () => fetchTravelBuddies(supabase, userId!), 
        enabled: !!userId, // Only run the query if userId is available
    });
};