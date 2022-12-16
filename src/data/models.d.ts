export interface UserDetails {
    username: string
    icon_id: string
    display_name?: string
}

export interface User extends UserDetails {
    followers: number // We could also use the actual followers. This would not be possible in an actual production app, but might make our life easier.
}

export interface PostContent {
    id: string
    content: string
    auto_complete: boolean
    timestamp: Date
}

export interface Post extends PostContent {
    user: User
    likes: number
    commentCount: number
}

export interface Comment {
    id: string
    user: User
    content: string
}

export interface GenerationParameters {
    mood: string
    temperature: number
}

export interface PostFilter {
    usernames?: string[]
}

export interface PaginationParameters {
    size: number
    token?: string
}
