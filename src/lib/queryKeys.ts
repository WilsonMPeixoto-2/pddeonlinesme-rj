type ExercicioParam = string | number;

const normalizeExercicio = (exercicio: ExercicioParam) => Number(exercicio);

export const queryKeys = {
  unidades: (exercicio: ExercicioParam, programa = "basico") =>
    ["unidades", { exercicio: normalizeExercicio(exercicio), programa }] as const,

  status: (exercicio: ExercicioParam, programa = "basico") =>
    ["unidades-status", { exercicio: normalizeExercicio(exercicio), programa }] as const,

  documentosCount: (exercicio: ExercicioParam, programa = "basico") =>
    ["documentos-count", { exercicio: normalizeExercicio(exercicio), programa }] as const,

  dashboard: (exercicio: ExercicioParam, programa = "basico") =>
    ["dashboard", { exercicio: normalizeExercicio(exercicio), programa }] as const,
};
