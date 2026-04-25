import { createContext, useContext, useState, type ReactNode } from "react";

interface ExercicioCtx {
  exercicio: string;
  setExercicio: (v: string) => void;
}

const ExercicioContext = createContext<ExercicioCtx>({
  exercicio: "2026",
  setExercicio: () => {},
});

export function ExercicioProvider({ children }: { children: ReactNode }) {
  const [exercicio, setExercicio] = useState("2026");
  return (
    <ExercicioContext.Provider value={{ exercicio, setExercicio }}>
      {children}
    </ExercicioContext.Provider>
  );
}

export function useExercicio() {
  return useContext(ExercicioContext);
}
