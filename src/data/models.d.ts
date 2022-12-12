export interface UserDetails {
    username: string,
    icon_id: string,
    display_name?: string,
}

export interface User extends UserDetails {
    followers: number // We could also use the actual followers. This would not be possible in an actual production app, but might make our life easier.
}