/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "pdde:exercicio";
const DEFAULT_EXERCICIO = "2026";
const EXERCICIOS_VALIDOS = new Set(["2025", "2026"]);

function isExercicioValido(value: unknown): value is string {
  return typeof value === "string" && EXERCICIOS_VALIDOS.has(value);
}

function readStoredExercicio() {
  try {
    if (typeof window === "undefined") return DEFAULT_EXERCICIO;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isExercicioValido(stored) ? stored : DEFAULT_EXERCICIO;
  } catch {
    return DEFAULT_EXERCICIO;
  }
}

interface ExercicioCtx {
  exercicio: string;
  setExercicio: (v: string) => void;
}

const ExercicioContext = createContext<ExercicioCtx>({
  exercicio: "2026",
  setExercicio: () => {},
});

export function ExercicioProvider({ children }: { children: ReactNode }) {
  const [exercicio, setExercicioState] = useState(readStoredExercicio);

  const setExercicio = (value: string) => {
    setExercicioState(isExercicioValido(value) ? value : DEFAULT_EXERCICIO);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, exercicio);
    } catch {
      // localStorage can be unavailable in private or restricted browser contexts.
    }
  }, [exercicio]);

  return (
    <ExercicioContext.Provider value={{ exercicio, setExercicio }}>
      {children}
    </ExercicioContext.Provider>
  );
}

export function useExercicio() {
  return useContext(ExercicioContext);
}
