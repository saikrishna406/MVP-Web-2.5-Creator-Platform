import { PointAction } from '@/types';

export const POINT_ACTIONS: Record<string, PointAction> = {
    daily_login: {
        action: 'daily_login',
        points: 10,
        daily_limit: 1,
        description: 'Daily login bonus',
    },
    like_post: {
        action: 'like_post',
        points: 2,
        daily_limit: 20,
        description: 'Like a post',
    },
    comment_post: {
        action: 'comment_post',
        points: 5,
        daily_limit: 10,
        description: 'Comment on a post',
    },
    share_post: {
        action: 'share_post',
        points: 3,
        daily_limit: 5,
        description: 'Share a post',
    },
};
