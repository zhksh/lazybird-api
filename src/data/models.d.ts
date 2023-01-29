/**
 * Defines a user uniquely identified by the username.
 */
export interface User {
    username: string
    icon_id: string
    display_name?: string
    bio?: string
}

export interface UserMeta {
    followers: User[]   // The user array would not scale particularly well in a real application, but should be fine for sake of the practical.
}

export interface PostRequest {
    content: string
    username: string,
    autoReplyOptions: AutoReply
}

export interface Post {
    id: string
    content: string
    autoreply: boolean
    timestamp: Date
}

/**
 * Extends a Post by adding meta information.
 */
export interface PostMeta extends Post {
    user: User
    likes: string[]
    comments: Comment[]
}

export type Mood = 'neutral' | 'happy' | 'angry' | 'ironic' | 'sad'

export interface AutoReply {
    mood: Mood
    temperature: number
    history_length: number
    ours: string
}

export interface Comment {
    id: string
    user: User
    content: string
}

export interface PostFilter {
    usernames?: string[]
}

export interface PaginationParameters {
    size: number
    token?: string
}

export interface PageToken {
    id: string
    date: Date
}

export interface InputEvent {
    eventType: 'subscribe' | 'unsubscribe'
    postId: string
}

export interface OutputEvent {
    eventType: 'error' | 'updated'
    data: Error | PostMeta
}

export interface Error {
    code: number
    message: string
}

export interface CommentHistory {
    original: string,
    history: HistoryItem[]
}

export interface HistoryItem {
    source: string,
    msg: string
}