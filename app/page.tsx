"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { courses } from "@/data/courses";

export default function Home() {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.toLowerCase().trim();

  const filteredCourses = useMemo(() => {
    if (!normalizedSearch) return courses;

    return courses.filter((course) => {
      const searchableText = `
        ${course.name}
        ${course.code}
        ${course.semester}
      `.toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [normalizedSearch]);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold mb-3">Noti</h1>

        <p className="text-slate-300 mb-8">
          Busca tu ramo, ingresa tus notas y calcula cuánto necesitas para
          aprobar.
        </p>

        <input
          type="text"
          placeholder="Busca por nombre o sigla, ej: Calculo, MAT1620, Algebra..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {filteredCourses.length} ramo
            {filteredCourses.length === 1 ? "" : "s"} encontrado
            {filteredCourses.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="block rounded-xl border border-slate-700 bg-slate-900 p-4 transition hover:bg-slate-800"
            >
              <h2 className="text-lg font-semibold text-white">
                {course.name} - {course.semester}
              </h2>

              <p className="text-sm text-slate-400">{course.code}</p>
            </Link>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-300">
            No encontré ese ramo todavía. Más adelante aquí podrías mostrar un
            botón tipo “Solicitar agregar ramo”.
          </div>
        )}
      </section>
    </main>
  );
}