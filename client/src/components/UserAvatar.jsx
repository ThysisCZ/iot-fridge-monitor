import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserAvatar ({name, size}) {
    const firstLetter = name?.charAt(0).toUpperCase() || ":D";

    return (
        <Avatar size={size}>
            <AvatarFallback>{firstLetter}</AvatarFallback>
        </Avatar>
    );
}