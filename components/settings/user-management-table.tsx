"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Search,
  User,
  Mail,
  Phone,
  Shield,
  Crown,
  Truck,
  Calculator,
} from "lucide-react";
import { EditUserDialog } from "./edit-user-dialog";
import { deleteUser } from "@/lib/actions/settings";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface UserManagementTableProps {
  users: User[];
  organizationSlug: string;
  currentUser: {
    id: string;
    roles: string[];
  };
}

const roleIcons = {
  pompist: User,
  dispatcher: Truck,
  manager: Shield,
  accountant: Calculator,
  organization_admin: Crown,
};

const roleLabels = {
  pompist: "Pompist",
  dispatcher: "Dispatcher",
  manager: "Manager",
  accountant: "Accountant",
  organization_admin: "Organization Admin",
};

const roleColors = {
  pompist: "bg-blue-100 text-blue-800",
  dispatcher: "bg-green-100 text-green-800",
  manager: "bg-purple-100 text-purple-800",
  accountant: "bg-orange-100 text-orange-800",
  organization_admin: "bg-red-100 text-red-800",
};

export function UserManagementTable({
  users,
  organizationSlug,
  currentUser,
}: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const filteredUsers = users.filter(
    (user) =>
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roles.some((role) =>
        roleLabels[role as keyof typeof roleLabels]
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(userId);

    try {
      const result = await deleteUser(organizationSlug, userId);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const canEditUser = (user: User) => {
    // Organization admins can edit anyone except other organization admins (unless they're the same person)
    if (currentUser.roles.includes("organization_admin")) {
      return (
        !user.roles.includes("organization_admin") || user.id === currentUser.id
      );
    }

    // Managers can edit non-admin users
    if (currentUser.roles.includes("manager")) {
      return (
        !user.roles.includes("organization_admin") &&
        !user.roles.includes("manager")
      );
    }

    return false;
  };

  const canDeleteUser = (user: User) => {
    // Cannot delete yourself
    if (user.id === currentUser.id) return false;

    // Organization admins can delete anyone except other organization admins
    if (currentUser.roles.includes("organization_admin")) {
      return !user.roles.includes("organization_admin");
    }

    // Managers can delete non-admin users
    if (currentUser.roles.includes("manager")) {
      return (
        !user.roles.includes("organization_admin") &&
        !user.roles.includes("manager")
      );
    }

    return false;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchTerm
                    ? "No users found matching your search."
                    : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user.first_name.charAt(0)}
                          {user.last_name.charAt(0)}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                          {user.id === currentUser.id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {user.email ? (
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-3 h-3 mr-1.5 text-gray-400" />
                          {user.email}
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-gray-500 italic">
                          <Mail className="w-3 h-3 mr-1.5 text-gray-400" />
                          No email address
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-3 h-3 mr-1.5 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => {
                        const IconComponent =
                          roleIcons[role as keyof typeof roleIcons];
                        return (
                          <Badge
                            key={role}
                            variant="secondary"
                            className={`text-xs ${
                              roleColors[role as keyof typeof roleColors]
                            }`}
                          >
                            {IconComponent && (
                              <IconComponent className="w-3 h-3 mr-1" />
                            )}
                            {roleLabels[role as keyof typeof roleLabels] ||
                              role}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {user.email && (
                          <DropdownMenuItem
                            onClick={() =>
                              navigator.clipboard.writeText(user.email)
                            }
                          >
                            Copy email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {canEditUser(user) && (
                          <EditUserDialog
                            user={user}
                            organizationSlug={organizationSlug}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                Edit user
                              </DropdownMenuItem>
                            }
                          />
                        )}
                        {canDeleteUser(user) && (
                          <DropdownMenuItem
                            className="text-red-600"
                            disabled={isDeleting === user.id}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            {isDeleting === user.id
                              ? "Deactivating..."
                              : "Deactivate user"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
