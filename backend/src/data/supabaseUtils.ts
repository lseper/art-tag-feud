const logSupabaseError = (context: string, error: unknown) => {
    if (error) {
        console.error(`Supabase error (${context}):`, error);
    }
};

export { logSupabaseError };
