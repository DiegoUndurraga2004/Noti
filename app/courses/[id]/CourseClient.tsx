"use client";

import type { Course } from "@/data/courses";
import { calculateCourseResult } from "@/lib/gradeCalculations";
import { useEffect, useState } from "react";

export default function CourseClient({ course }: { course: Course }) {
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [hasLoadedGrades, setHasLoadedGrades] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`grades-${course.id}`);

    if (saved) {
      setGrades(JSON.parse(saved));
    }

    setHasLoadedGrades(true);
  }, [course.id]);

  useEffect(() => {
    if (!hasLoadedGrades) return;

    localStorage.setItem(`grades-${course.id}`, JSON.stringify(grades));
  }, [grades, course.id, hasLoadedGrades]);

  const handleChange = (evaluationId: string, value: string) => {
    if (value === "") {
      setGrades((prev) => {
        const updated = { ...prev };
        delete updated[evaluationId];
        return updated;
      });
      return;
    }

    setGrades((prev) => ({
      ...prev,
      [evaluationId]: Number(value),
    }));
  };

  const clearGrades = () => {
    setGrades({});
    localStorage.removeItem(`grades-${course.id}`);
  };

  const result = calculateCourseResult(course, grades);

  const truncate = (value: number, decimals: number = 2) => {
    const factor = 10 ** decimals;
    return (Math.trunc(value * factor) / factor).toFixed(decimals);
  };

  const roundUpGrade = (value: number) => {
    return Math.ceil(value * 10) / 10;
  };

  const formatNeededGrade = (value: number) => {
    return roundUpGrade(Math.max(value, 1)).toFixed(1);
  };

  const formatDetailValue = (value: number | string, decimals: number = 2) => {
    if (typeof value === "string") return value;
    return truncate(value, decimals);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-2xl font-bold mb-2">
        {course.name} - {course.semester}
      </h1>

      <p className="text-slate-400 mb-6">{course.code}</p>

      <p className="text-slate-300 mb-6">{course.formulaDescription}</p>

      <button
        type="button"
        onClick={clearGrades}
        className="mb-6 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
      >
        Limpiar notas
      </button>

      <div className="space-y-4">
        {course.evaluations.map((ev) => (
          <div
            key={ev.id}
            className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700"
          >
            <div>
              <p className="font-medium">{ev.name}</p>
              {ev.unit && <p className="text-sm text-slate-400">{ev.unit}</p>}
            </div>

            <input
              type="number"
              min={ev.min}
              max={ev.max}
              step={ev.step ?? 0.1}
              placeholder="Valor"
              value={grades[ev.id] ?? ""}
              className="w-24 p-2 rounded bg-slate-800 text-white border border-slate-600"
              onChange={(e) => handleChange(ev.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
        <p className="font-semibold">Resultado</p>
        {result.alerts && result.alerts.length > 0 && (
            <div className="space-y-2">
              {result.alerts.map((alert) => (
                <p
                  key={alert.message}
                  className={
                    alert.type === "success"
                      ? "text-green-400"
                      : alert.type === "danger"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }
                >
                  {alert.message}
                </p>
              ))}
            </div>
          )}
        {result.details.length > 0 && (
          <div className="space-y-1">
            {result.details.map((detail) => (
              <p key={`${detail.label}-${String(detail.value)}`}>
                {detail.label}:{" "}
                {formatDetailValue(detail.value, detail.decimals)}
              </p>
            ))}
          </div>
        )}

        {result.needed.length > 0 && (
          <div className="space-y-1">
            {result.needed.map((needed) => (
              <p key={needed.label}>
                {needed.label}: {formatNeededGrade(needed.value)}
              </p>
            ))}
          </div>
        )}

        {!result.isComplete && (
          <p className="text-slate-400">{result.message}</p>
        )}

        {result.isComplete && result.finalGrade !== null && (
          <p>
            Nota final estimada: {truncate(result.finalGrade)}{" "}
            {result.passed ? "✅ Aprobado" : "❌ Reprobado"}
          </p>
        )}
      </div>
    </main>
  );
}
