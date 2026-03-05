import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Bookmark, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function UserMenu() {
    const { data: user, isLoading } = trpc.auth.me.useQuery();
    const { theme, toggleTheme } = useTheme();
    const logout = trpc.auth.logout.useMutation({
        onSuccess: () => {
            window.location.reload();
        }
    });

    if (isLoading) {
        return <Button variant="ghost" size="sm" disabled>Loading...</Button>;
    }

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                {toggleTheme && (
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </Button>
                )}
                <Button asChild variant="default" size="sm">
                    <a href={getLoginUrl()}>Sign In</a>
                </Button>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {user.name || "User"}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                        {user.name && <p className="font-medium">{user.name}</p>}
                        {user.email && <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>}
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer flex items-center">
                        <Bookmark className="mr-2 h-4 w-4" />
                        My Collection
                    </Link>
                </DropdownMenuItem>

                {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            Admin Dashboard
                        </Link>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                {toggleTheme && (
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); toggleTheme(); }} className="cursor-pointer flex items-center">
                        {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                        {theme === "light" ? "Dark Mode" : "Light Mode"}
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => logout.mutate()}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
