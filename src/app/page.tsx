"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured, type Todo } from "@/lib/supabase";

type Filter = "all" | "active" | "done";

const FILTER_LABELS: Record<Filter, string> = {
  all: "전체",
  active: "진행 중",
  done: "완료",
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;

    (async () => {
      // 로그인 화면 없이 브라우저마다 익명 사용자로 로그인합니다.
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData.session) {
        const { error: signInError } = await client.auth.signInAnonymously();
        if (signInError) {
          setError(
            `익명 로그인 실패: ${signInError.message} (Supabase에서 Anonymous Sign-Ins를 켰는지 확인하세요)`
          );
          setLoading(false);
          return;
        }
      }

      const { data, error: loadError } = await client
        .from("todos")
        .select("id, title, is_done, created_at")
        .order("created_at", { ascending: false });

      if (loadError) setError(`불러오기 실패: ${loadError.message}`);
      else setTodos(data ?? []);
      setLoading(false);
    })();
  }, []);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const text = title.trim();
    if (!text || !supabase) return;

    const { data, error: insertError } = await supabase
      .from("todos")
      .insert({ title: text })
      .select("id, title, is_done, created_at")
      .single();

    if (insertError) return setError(`추가 실패: ${insertError.message}`);
    setTodos((prev) => [data, ...prev]);
    setTitle("");
    setError(null);
  }

  async function toggleTodo(todo: Todo) {
    if (!supabase) return;
    const next = !todo.is_done;
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, is_done: next } : t))
    );
    const { error: updateError } = await supabase
      .from("todos")
      .update({ is_done: next })
      .eq("id", todo.id);
    if (updateError) {
      setError(`수정 실패: ${updateError.message}`);
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, is_done: todo.is_done } : t))
      );
    }
  }

  async function deleteTodo(id: number) {
    if (!supabase) return;
    const before = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const { error: deleteError } = await supabase.from("todos").delete().eq("id", id);
    if (deleteError) {
      setError(`삭제 실패: ${deleteError.message}`);
      setTodos(before);
    }
  }

  async function clearDone() {
    if (!supabase) return;
    const doneIds = todos.filter((t) => t.is_done).map((t) => t.id);
    if (doneIds.length === 0) return;
    const before = todos;
    setTodos((prev) => prev.filter((t) => !t.is_done));
    const { error: deleteError } = await supabase.from("todos").delete().in("id", doneIds);
    if (deleteError) {
      setError(`삭제 실패: ${deleteError.message}`);
      setTodos(before);
    }
  }

  const visible = useMemo(
    () =>
      todos.filter((t) =>
        filter === "all" ? true : filter === "done" ? t.is_done : !t.is_done
      ),
    [todos, filter]
  );
  const remaining = todos.filter((t) => !t.is_done).length;

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">할 일 목록</h1>

      {!isSupabaseConfigured && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Supabase 환경변수가 없습니다. <code>NEXT_PUBLIC_SUPABASE_URL</code>과{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>를 설정하세요.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <form onSubmit={addTodo} className="mb-4 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일을 입력하세요"
          maxLength={200}
          disabled={!isSupabaseConfigured || loading}
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!title.trim() || !isSupabaseConfigured || loading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          추가
        </button>
      </form>

      <div className="mb-3 flex items-center justify-between text-sm">
        <div className="flex gap-1">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 ${
                filter === f
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        <span className="text-neutral-500">남은 할 일 {remaining}개</span>
      </div>

      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
        {loading ? (
          <li className="p-4 text-center text-neutral-500">불러오는 중…</li>
        ) : visible.length === 0 ? (
          <li className="p-4 text-center text-neutral-500">할 일이 없습니다.</li>
        ) : (
          visible.map((todo) => (
            <li key={todo.id} className="group flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={todo.is_done}
                onChange={() => toggleTodo(todo)}
                className="h-5 w-5 accent-blue-600"
                aria-label={`${todo.title} 완료 표시`}
              />
              <span
                className={`flex-1 break-all ${
                  todo.is_done ? "text-neutral-400 line-through" : ""
                }`}
              >
                {todo.title}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="rounded px-2 py-1 text-sm text-neutral-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`${todo.title} 삭제`}
              >
                삭제
              </button>
            </li>
          ))
        )}
      </ul>

      {todos.some((t) => t.is_done) && (
        <div className="mt-3 text-right">
          <button onClick={clearDone} className="text-sm text-neutral-500 hover:text-red-600">
            완료된 항목 지우기
          </button>
        </div>
      )}
    </main>
  );
}
