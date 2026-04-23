import { z } from 'zod';

// ==========================================
// Stage 6.1: Zod Validation Schemas
// ==========================================

const uuidSchema = z.string().uuid('Invalid UUID format');

// --- Stripe / Checkout ---
export const CheckoutSchema = z.object({
    packageId: uuidSchema,
});

// --- Post Creation ---
export const CreatePostSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: z.string().min(1, 'Content is required').max(50000),
    image_url: z.string().url().nullable().optional(),
    access_type: z.enum(['public', 'token_gated', 'threshold_gated']),
    token_cost: z.number().int().min(0).optional().default(0),
    threshold_amount: z.number().int().min(0).optional().default(0),
}).refine(
    (data) => {
        if (data.access_type === 'token_gated') return (data.token_cost ?? 0) > 0;
        return true;
    },
    { message: 'Token cost must be > 0 for token_gated posts', path: ['token_cost'] }
).refine(
    (data) => {
        if (data.access_type === 'threshold_gated') return (data.threshold_amount ?? 0) > 0;
        return true;
    },
    { message: 'Threshold must be > 0 for threshold_gated posts', path: ['threshold_amount'] }
);

// --- Post Unlock ---
export const UnlockPostSchema = z.object({
    postId: uuidSchema,
});

// --- Post Interaction ---
export const InteractPostSchema = z.object({
    postId: uuidSchema,
    action: z.enum(['like']),
});

// --- Post Comment ---
export const CommentSchema = z.object({
    postId: uuidSchema,
    content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
});

// --- Gamification ---
export const GamificationActionSchema = z.object({
    action: z.enum(['daily_login', 'like_post', 'comment_post', 'share_post']),
    referenceId: uuidSchema.nullable().optional(),
});

// --- Redemption: Create Item ---
export const CreateRedemptionItemSchema = z.object({
    action: z.literal('create'),
    name: z.string().min(1).max(100),
    description: z.string().max(1000).optional().default(''),
    point_cost: z.number().int().min(1, 'Point cost must be at least 1'),
    quantity_available: z.number().int().min(0).optional().default(0),
    image_url: z.string().url().nullable().optional(),
});

// --- Redemption: Redeem Item ---
export const RedeemItemSchema = z.object({
    action: z.literal('redeem'),
    itemId: uuidSchema,
});

export const RedemptionSchema = z.discriminatedUnion('action', [
    CreateRedemptionItemSchema,
    RedeemItemSchema,
]);

