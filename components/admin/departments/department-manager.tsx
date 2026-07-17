"use client";

import { useActionState } from "react";

import { saveDepartmentAction, type DepartmentActionState } from "@/lib/departments/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Department = { id: string; name: string; email: string; isActive: boolean };
const initialState: DepartmentActionState = { status: "idle", message: "" };

function DepartmentForm({ department }: { department?: Department }) {
  const [state, formAction, pending] = useActionState(saveDepartmentAction, initialState);
  const editing = Boolean(department);

  return <form action={formAction} className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
    {department ? <input type="hidden" name="id" value={department.id} /> : null}
    <div className="grid gap-2"><Label htmlFor={department ? `department-name-${department.id}` : "department-name"}>Department</Label><Input id={department ? `department-name-${department.id}` : "department-name"} name="name" defaultValue={department?.name} required disabled={pending} /></div>
    <div className="grid gap-2"><Label htmlFor={department ? `department-email-${department.id}` : "department-email"}>Mailbox</Label><Input id={department ? `department-email-${department.id}` : "department-email"} name="email" type="email" defaultValue={department?.email} required disabled={pending} /></div>
    <label className="flex items-center gap-2 pb-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={department?.isActive ?? true} disabled={pending} /> Active</label>
    <Button type="submit" variant={editing ? "outline" : "default"} disabled={pending}>{pending ? "Saving..." : editing ? "Save" : "Add department"}</Button>
    {state.status !== "idle" ? <Alert className="sm:col-span-4" variant={state.status === "error" ? "destructive" : "success"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
  </form>;
}

export function DepartmentManager({ departments }: { departments: Department[] }) {
  return <div className="grid gap-4"><DepartmentForm />{departments.map((department) => <DepartmentForm key={department.id} department={department} />)}</div>;
}
