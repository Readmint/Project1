"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getJSON, postJSON } from "@/lib/api";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Users, Search, MoreVertical, Shield, UserX, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function UserManagementPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) {
                router.push("/admin/login");
                return;
            }

            const query = new URLSearchParams({
                page: page.toString(),
                limit: "15",
                role: roleFilter,
                search: search
            });

            const res = await getJSON(`/admin/users?${query.toString()}`, token);
            if (res.status === "success") {
                setUsers(res.data.users);
                setPagination(res.data.pagination);
            } else {
                if (res.status === 401 || res.status === 403) router.push("/admin/login");
                else toast.error(res.message || "Failed to fetch users");
            }
        } catch (error) {
            console.error(error);
            toast.error("System error fetching users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter]); // Search usually triggers on submit or debounce, here simpler

    const handleAction = async (userId: string, action: string, newRole?: string) => {
        const toastId = toast.loading("Processing...");
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const payload = { userId, action, newRole };
            const res = await postJSON("/admin/users/manage", payload, token);

            if (res.status === "success") {
                toast.success("User updated successfully", { id: toastId });
                fetchUsers(); // Refresh list
            } else {
                toast.error(res.message || "Action failed", { id: toastId });
            }
        } catch (err) {
            toast.error("System error", { id: toastId });
        }
    };

    // Create User State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "reader" });

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading("Creating user...");
        try {
            const token = localStorage.getItem("adminToken");
            if (!token) return;

            const res = await postJSON("/admin/users/create", newUser, token);

            if (res.status === "success") {
                toast.success("User created successfully", { id: toastId });
                setIsCreateOpen(false);
                setNewUser({ name: "", email: "", password: "", role: "reader" });
                fetchUsers();
            } else {
                toast.error(res.message || "Failed to create user", { id: toastId });
            }
        } catch (err) {
            toast.error("System error", { id: toastId });
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="flex-1 p-8 overflow-y-auto">

                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                        <p className="text-slate-500 text-sm mt-1">Manage accounts, roles, and access.</p>
                    </div>



                    <div className="flex gap-3">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Plus size={18} className="mr-2" /> Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <DialogHeader>
                                    <DialogTitle className="text-slate-900 dark:text-white">Create New User</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                                        <Input
                                            required
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            placeholder="John Doe"
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                                        <Input
                                            required
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="john@example.com"
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                                        <Input
                                            required
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="reader">Reader</option>
                                            <option value="author">Author</option>
                                            <option value="reviewer">Reviewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="content_manager">Content Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <DialogFooter className="mt-6">
                                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Create Account</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none"
                        >
                            <option value="all">All Roles</option>
                            <option value="reader">Reader</option>
                            <option value="author">Author</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="editor">Editor</option>
                            <option value="content_manager">Content Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </header>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading users...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td></tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                                                        {user.name?.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge role={user.role} />
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* Assuming is_email_verified proxy for active, or we check suspension */}
                                                {/* Since we don't have suspended in user root object in getSystemUsers SQL yet (unless we parse profile_data), verify status is okay */}
                                                {user.is_email_verified ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Unverified
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg outline-none">
                                                        <MoreVertical size={16} className="text-slate-400" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Manage Access</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleAction(user.id, 'update_role', 'reviewer')}>
                                                            <Shield size={14} className="mr-2" /> Make Reviewer
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(user.id, 'update_role', 'editor')}>
                                                            <Shield size={14} className="mr-2" /> Make Editor
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(user.id, 'update_role', 'author')}>
                                                            <Shield size={14} className="mr-2" /> Make Author
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleAction(user.id, 'suspend')}>
                                                            <UserX size={14} className="mr-2" /> Suspend Account
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {pagination && (
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={page >= pagination.pages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div >
    );
}

function Badge({ role }: { role: string }) {
    const styles: any = {
        admin: "bg-red-50 text-red-700 border-red-100",
        content_manager: "bg-pink-50 text-pink-700 border-pink-100",
        editor: "bg-purple-50 text-purple-700 border-purple-100",
        reviewer: "bg-amber-50 text-amber-700 border-amber-100",
        author: "bg-blue-50 text-blue-700 border-blue-100",
        reader: "bg-slate-50 text-slate-700 border-slate-100",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[role] || styles.reader}`}>
            {role.replace('_', ' ')}
        </span>
    );
}
