"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSupabaseError = void 0;
const logSupabaseError = (context, error) => {
    if (error) {
        console.error(`Supabase error (${context}):`, error);
    }
};
exports.logSupabaseError = logSupabaseError;
//# sourceMappingURL=supabaseUtils.js.map