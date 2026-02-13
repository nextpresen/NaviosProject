"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { Card, Badge, Spinner } from "@/components/ui";
import type { UserProfile } from "@/types/auth";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <AdminGuard>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">ユーザー管理</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-slate-500">
            登録ユーザーがいません
          </p>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3">メールアドレス</th>
                    <th className="px-4 py-3">表示名</th>
                    <th className="px-4 py-3">ロール</th>
                    <th className="px-4 py-3">登録日</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.display_name ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={user.role === "admin" ? "blue" : "gray"}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(user.created_at).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-sm text-brand-700 hover:underline"
                        >
                          投稿を見る
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminGuard>
  );
}
