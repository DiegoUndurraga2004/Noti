import type {
  ComponentRule,
  Course,
  CourseRule,
  Formula,
  WeightedItem,
} from "@/data/courses";

const EPSILON = 0.0000001;

export type ResultDetail = {
  label: string;
  value: number | string;
  decimals?: number;
};

export type NeededResult = {
  label: string;
  value: number;
};

export type ResultAlert = {
  type: "success" | "warning" | "danger";
  message: string;
};

export type CalculationResult = {
  currentAverage: number | null;
  neededAverage: number | null;
  finalGrade: number | null;
  passed: boolean | null;
  isComplete: boolean;
  message: string;
  details: ResultDetail[];
  needed: NeededResult[];
  missingEvaluationIds: string[];
  alerts?: ResultAlert[];
};

type FormulaResult = {
  value: number | null;
  currentValue: number | null;
  missingEvaluationIds: string[];
  gatePassed: boolean;
  gateMessage?: string;
  details: ResultDetail[];
  linear?: {
    totalWeight: number;
    completedWeight: number;
    completedPoints: number;
    missingWeight: number;
  };
};

type ComponentEvaluation = {
  component: ComponentRule;
  value: number | null;
  currentValue: number | null;
  missingEvaluationIds: string[];
  gatePassed: boolean;
  details: ResultDetail[];
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function isDefined(value: number | undefined): value is number {
  return value !== undefined && !Number.isNaN(value);
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function calculateWeightedProgress(
  grades: Record<string, number>,
  items: WeightedItem[]
) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let completedWeight = 0;
  let completedPoints = 0;
  const missingEvaluationIds: string[] = [];

  for (const item of items) {
    const grade = grades[item.evaluationId];

    if (isDefined(grade)) {
      completedWeight += item.weight;
      completedPoints += grade * item.weight;
    } else {
      missingEvaluationIds.push(item.evaluationId);
    }
  }

  const missingWeight = totalWeight - completedWeight;

  return {
    totalWeight,
    completedWeight,
    completedPoints,
    missingWeight,
    missingEvaluationIds,
    currentValue:
      completedWeight > 0 ? completedPoints / completedWeight : null,
    finalValue: missingWeight === 0 ? completedPoints / totalWeight : null,
  };
}

function calculateNeededAverage(
  target: number,
  completedPoints: number,
  missingWeight: number,
  totalWeight: number
) {
  if (missingWeight <= 0) return null;
  return (target * totalWeight - completedPoints) / missingWeight;
}

function evaluateFormula(
  formula: Formula,
  grades: Record<string, number>
): FormulaResult {
  if (formula.type === "EVALUATION") {
    const value = grades[formula.evaluationId];

    return {
      value: isDefined(value) ? value : null,
      currentValue: isDefined(value) ? value : null,
      missingEvaluationIds: isDefined(value) ? [] : [formula.evaluationId],
      gatePassed: true,
      details: [],
    };
  }

  if (formula.type === "AVERAGE") {
    const items = formula.evaluationIds.map((evaluationId) => ({
      evaluationId,
      weight: 1,
    }));

    const progress = calculateWeightedProgress(grades, items);

    return {
      value: progress.finalValue,
      currentValue: progress.currentValue,
      missingEvaluationIds: progress.missingEvaluationIds,
      gatePassed: true,
      details: [],
      linear: {
        totalWeight: progress.totalWeight,
        completedWeight: progress.completedWeight,
        completedPoints: progress.completedPoints,
        missingWeight: progress.missingWeight,
      },
    };
  }

  if (formula.type === "WEIGHTED_AVERAGE") {
    const progress = calculateWeightedProgress(grades, formula.items);

    return {
      value: progress.finalValue,
      currentValue: progress.currentValue,
      missingEvaluationIds: progress.missingEvaluationIds,
      gatePassed: true,
      details: [],
      linear: {
        totalWeight: progress.totalWeight,
        completedWeight: progress.completedWeight,
        completedPoints: progress.completedPoints,
        missingWeight: progress.missingWeight,
      },
    };
  }

  if (formula.type === "TOP_N_AVERAGE") {
    const results = formula.items.map((item) => evaluateFormula(item, grades));
    const missingEvaluationIds = unique(
      results.flatMap((result) => result.missingEvaluationIds)
    );

    if (missingEvaluationIds.length > 0) {
      return {
        value: null,
        currentValue: null,
        missingEvaluationIds,
        gatePassed: true,
        details: [],
      };
    }

    const values = results
      .map((result) => result.value)
      .filter((value): value is number => value !== null)
      .sort((a, b) => b - a);

    const topValues = values.slice(0, formula.n);
    const finalValue =
      topValues.reduce((sum, value) => sum + value, 0) / formula.n;

    return {
      value: finalValue,
      currentValue: finalValue,
      missingEvaluationIds: [],
      gatePassed: true,
      details: [],
    };
  }

  if (formula.type === "EXAM_REPLACES_LOWEST_TESTS") {
    const exam = grades[formula.examId];
    const testValues = formula.testIds.map((id) => grades[id]);

    const missingEvaluationIds = [
      ...formula.testIds.filter((id) => !isDefined(grades[id])),
      ...(!isDefined(exam) ? [formula.examId] : []),
    ];

    if (missingEvaluationIds.length > 0) {
      return {
        value: null,
        currentValue: null,
        missingEvaluationIds,
        gatePassed: true,
        details: [],
      };
    }

    const validTestValues = testValues as number[];
    const lowestTest = Math.min(...validTestValues);
    const testSum = validTestValues.reduce((sum, value) => sum + value, 0);

    const effectiveTestSum =
      testSum - lowestTest + Math.max(lowestTest, exam as number);

    const finalValue =
      (effectiveTestSum + (exam as number)) / (validTestValues.length + 1);

    return {
      value: finalValue,
      currentValue: finalValue,
      missingEvaluationIds: [],
      gatePassed: true,
      details: [],
    };
  }

  if (formula.type === "POINTS_TO_GRADE") {
    const missingEvaluationIds: string[] = [];
    let points = 0;
    let completedMaxPoints = 0;

    const totalMaxPoints = formula.items.reduce(
      (sum, item) => sum + item.maxPoints,
      0
    );

    for (const item of formula.items) {
      const value = grades[item.evaluationId];

      if (isDefined(value)) {
        points += value;
        completedMaxPoints += item.maxPoints;
      } else {
        missingEvaluationIds.push(item.evaluationId);
      }
    }

    let attendanceFactor = 1;

    if (formula.attendanceFactor) {
      const attendance = grades[formula.attendanceFactor.evaluationId];

      if (!isDefined(attendance)) {
        missingEvaluationIds.push(formula.attendanceFactor.evaluationId);
      } else {
        attendanceFactor = formula.attendanceFactor.defaultFactor;

        for (const threshold of formula.attendanceFactor.thresholds) {
          if (attendance >= threshold.min) {
            attendanceFactor = threshold.factor;
            break;
          }
        }
      }
    }

    let gatePassed = true;
    let gateMessage: string | undefined;

    if (formula.gate) {
      const gateValue = grades[formula.gate.evaluationId];

      if (!isDefined(gateValue)) {
        missingEvaluationIds.push(formula.gate.evaluationId);
      } else if (gateValue < formula.gate.minimum) {
        gatePassed = false;
        gateMessage = `No se cumple el mínimo requerido en ${formula.gate.evaluationId}.`;
      }
    }

    const currentValue =
      completedMaxPoints > 0 ? (points / completedMaxPoints) * 6 + 1 : null;

    if (missingEvaluationIds.length > 0) {
      return {
        value: null,
        currentValue,
        missingEvaluationIds: unique(missingEvaluationIds),
        gatePassed,
        gateMessage,
        details: [
          {
            label: "Puntaje proyecto actual",
            value: `${points}/${totalMaxPoints}`,
          },
          { label: "Factor asistencia", value: attendanceFactor, decimals: 2 },
        ],
      };
    }

    const weightedPoints = Math.min(points * attendanceFactor, totalMaxPoints);

    const value = gatePassed
      ? (weightedPoints / totalMaxPoints) * 6 + 1
      : (formula.gate?.failValue ?? 1);

    return {
      value,
      currentValue: value,
      missingEvaluationIds: [],
      gatePassed,
      gateMessage,
      details: [
        { label: "Puntaje proyecto", value: `${points}/${totalMaxPoints}` },
        { label: "Factor asistencia", value: attendanceFactor, decimals: 2 },
      ],
    };
  }

  return {
    value: null,
    currentValue: null,
    missingEvaluationIds: [],
    gatePassed: false,
    details: [],
  };
}

function calculateWeightedAverageRule(
  course: Course,
  rule: Extract<CourseRule, { type: "WEIGHTED_AVERAGE" }>,
  grades: Record<string, number>
): CalculationResult {
  const progress = calculateWeightedProgress(grades, rule.items);

  const neededAverage =
    progress.missingWeight > 0
      ? calculateNeededAverage(
          course.passingGrade,
          progress.completedPoints,
          progress.missingWeight,
          progress.totalWeight
        )
      : null;

  const isComplete = progress.missingWeight === 0;
  const finalGrade = isComplete ? progress.finalValue : null;
  const passed =
    finalGrade !== null ? finalGrade + EPSILON >= course.passingGrade : null;

  return {
    currentAverage: progress.currentValue,
    neededAverage,
    finalGrade,
    passed,
    isComplete,
    message: isComplete
      ? passed
        ? "Curso aprobado."
        : "Curso reprobado."
      : "Faltan evaluaciones para calcular la nota final completa.",
    details: [
      {
        label: "Promedio actual",
        value: progress.currentValue ?? 0,
        decimals: 2,
      },
      {
        label: "Ponderación completada",
        value: `${progress.completedWeight}/${progress.totalWeight}`,
      },
    ],
    needed:
      neededAverage !== null
        ? [
            {
              label: "Promedio necesario en lo restante para aprobar",
              value: neededAverage,
            },
          ]
        : [],
    missingEvaluationIds: progress.missingEvaluationIds,
  };
}

function calculateTopNAverageRule(
  course: Course,
  rule: Extract<CourseRule, { type: "TOP_N_AVERAGE" }>,
  grades: Record<string, number>
): CalculationResult {
  const formulaResult = evaluateFormula(
    { type: "TOP_N_AVERAGE", n: rule.n, items: rule.items },
    grades
  );

  const finalGrade = formulaResult.value;
  const passed =
    finalGrade !== null ? finalGrade + EPSILON >= course.passingGrade : null;

  return {
    currentAverage: finalGrade,
    neededAverage: null,
    finalGrade,
    passed,
    isComplete: finalGrade !== null,
    message:
      finalGrade !== null
        ? passed
          ? "Curso aprobado."
          : "Curso reprobado."
        : "Ingresa todas las notas requeridas para calcular esta regla.",
    details:
      finalGrade !== null
        ? [{ label: "Nota final estimada", value: finalGrade, decimals: 2 }]
        : [],
    needed: [],
    missingEvaluationIds: formulaResult.missingEvaluationIds,
  };
}

function evaluateComponent(
  component: ComponentRule,
  grades: Record<string, number>
): ComponentEvaluation {
  const formulaResult = evaluateFormula(component.formula, grades);

  const value =
    formulaResult.value !== null && component.roundTo !== undefined
      ? roundTo(formulaResult.value, component.roundTo)
      : formulaResult.value;

  const currentValue =
    formulaResult.currentValue !== null && component.roundTo !== undefined
      ? roundTo(formulaResult.currentValue, component.roundTo)
      : formulaResult.currentValue;

  return {
    component,
    value,
    currentValue,
    missingEvaluationIds: formulaResult.missingEvaluationIds,
    gatePassed: formulaResult.gatePassed,
    details: formulaResult.details,
  };
}

function calculateWeightedComponentsRule(
  course: Course,
  rule: Extract<CourseRule, { type: "WEIGHTED_COMPONENTS" }>,
  grades: Record<string, number>
): CalculationResult {
  const componentResults = rule.components.map((component) =>
    evaluateComponent(component, grades)
  );

  const missingEvaluationIds = unique(
    componentResults.flatMap((result) => result.missingEvaluationIds)
  );

  const isComplete = missingEvaluationIds.length === 0;

  const details: ResultDetail[] = [];
  const needed: NeededResult[] = [];

  for (const result of componentResults) {
    const displayValue = result.value ?? result.currentValue;

    if (displayValue !== null) {
      details.push({
        label:
          result.value !== null
            ? result.component.name
            : `${result.component.name} actual`,
        value: displayValue,
        decimals: result.component.roundTo ?? 2,
      });
    }

    for (const detail of result.details) {
      details.push(detail);
    }

    if (result.component.minimum !== undefined && result.value === null) {
      const formulaResult = evaluateFormula(result.component.formula, grades);

      if (formulaResult.linear && formulaResult.linear.missingWeight > 0) {
        const required = calculateNeededAverage(
          result.component.minimum,
          formulaResult.linear.completedPoints,
          formulaResult.linear.missingWeight,
          formulaResult.linear.totalWeight
        );

        if (required !== null) {
          needed.push({
            label: `Promedio necesario en lo restante de ${result.component.name} para llegar al mínimo`,
            value: required,
          });
        }
      }

      if (
        result.component.formula.type === "EVALUATION" &&
        result.missingEvaluationIds.length > 0
      ) {
        needed.push({
          label: `Nota mínima necesaria en ${result.component.name}`,
          value: result.component.minimum,
        });
      }
    }
  }

  let finalGrade: number | null = null;
  let passed: boolean | null = null;

  if (isComplete) {
    const componentValues = new Map(
      componentResults.map((result) => [result.component.id, result.value ?? 0])
    );

    const rawFinalGrade = componentResults.reduce((sum, result) => {
      return sum + (result.value ?? 0) * result.component.weight;
    }, 0);

    const gateFailed = componentResults.some((result) => !result.gatePassed);

    const minimumsMet = componentResults.every((result) => {
      if (result.component.minimum === undefined || result.value === null) {
        return true;
      }

      return result.value + EPSILON >= result.component.minimum;
    });

    if (gateFailed && rule.gateFailStrategy?.type === "USE_COMPONENT_CAP") {
      const componentValue =
        componentValues.get(rule.gateFailStrategy.componentId) ?? rawFinalGrade;

      finalGrade = Math.min(componentValue, rule.gateFailStrategy.cap);
      passed = false;
    } else if (!minimumsMet) {
      if (rule.failStrategy === "MIN_COMPONENT") {
        finalGrade = Math.min(
          ...componentResults.map((result) => result.value ?? 0)
        );
      } else if (rule.failStrategy === "CAP_AT_3_9") {
        finalGrade = Math.min(rawFinalGrade, 3.9);
      } else {
        finalGrade = rawFinalGrade;
      }

      passed = false;
    } else {
      finalGrade = rawFinalGrade;
      passed = finalGrade + EPSILON >= course.passingGrade;
    }
  }

  const currentComponents = componentResults.filter(
    (result) => result.value !== null || result.currentValue !== null
  );

  const currentWeight = currentComponents.reduce(
    (sum, result) => sum + result.component.weight,
    0
  );

  const currentAverage =
    currentWeight > 0
      ? currentComponents.reduce((sum, result) => {
          return (
            sum +
            (result.value ?? result.currentValue ?? 0) * result.component.weight
          );
        }, 0) / currentWeight
      : null;

  return {
    currentAverage,
    neededAverage: needed[0]?.value ?? null,
    finalGrade,
    passed,
    isComplete,
    message: isComplete
      ? passed
        ? "Curso aprobado."
        : "Curso reprobado."
      : "Faltan evaluaciones para calcular la nota final completa.",
    details,
    needed,
    missingEvaluationIds,
  };
}

function calculateBaseCourseResult(
  course: Course,
  grades: Record<string, number>
): CalculationResult {
  if (course.rule.type === "WEIGHTED_AVERAGE") {
    return calculateWeightedAverageRule(course, course.rule, grades);
  }

  if (course.rule.type === "TOP_N_AVERAGE") {
    return calculateTopNAverageRule(course, course.rule, grades);
  }

  if (course.rule.type === "WEIGHTED_COMPONENTS") {
    return calculateWeightedComponentsRule(course, course.rule, grades);
  }

  return {
    currentAverage: null,
    neededAverage: null,
    finalGrade: null,
    passed: null,
    isComplete: false,
    message: "Este curso usa una regla todavía no soportada.",
    details: [],
    needed: [],
    missingEvaluationIds: [],
  };
}

function calculateGenericNeededAverage(
  course: Course,
  grades: Record<string, number>,
  missingEvaluationIds: string[]
): {
  needed: NeededResult | null;
  alert: ResultAlert | null;
} {
  const uniqueMissingIds = unique(missingEvaluationIds);

  if (uniqueMissingIds.length === 0) {
    return { needed: null, alert: null };
  }

  const hasNonGradeMissing = uniqueMissingIds.some((id) => {
    const evaluation = course.evaluations.find((ev) => ev.id === id);
    return (evaluation?.inputType ?? "grade") !== "grade";
  });

  if (hasNonGradeMissing) {
    return { needed: null, alert: null };
  }

  const fillMissingGrades = (value: number) => {
    const filledGrades = { ...grades };

    for (const id of uniqueMissingIds) {
      filledGrades[id] = value;
    }

    return filledGrades;
  };

  const passesWith = (value: number) => {
    const simulatedResult = calculateBaseCourseResult(
      course,
      fillMissingGrades(value)
    );

    return simulatedResult.passed === true;
  };

  if (passesWith(1)) {
    return {
      needed: null,
      alert: {
        type: "success",
        message:
          "Ya estás en buen camino: incluso con la nota mínima en lo restante, aprobarías el curso.",
      },
    };
  }

  if (!passesWith(7)) {
    return {
      needed: null,
      alert: {
        type: "danger",
        message:
          "Con las notas actuales, no alcanza para aprobar aunque obtengas 7.0 en todas las evaluaciones restantes.",
      },
    };
  }

  let low = 1;
  let high = 7;

  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;

    if (passesWith(mid)) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return {
    needed: {
      label: "Nota necesaria en cada evaluación restante para aprobar el curso",
      value: high,
    },
    alert: {
      type: "warning",
      message:
        "Este cálculo asume que obtienes la misma nota en todas las evaluaciones restantes.",
    },
  };
}

export function calculateCourseResult(
  course: Course,
  grades: Record<string, number>
): CalculationResult {
  const baseResult = calculateBaseCourseResult(course, grades);

  if (baseResult.isComplete) {
    return baseResult;
  }

  const genericNeededAverage = calculateGenericNeededAverage(
    course,
    grades,
    baseResult.missingEvaluationIds
  );

  return {
    ...baseResult,
    neededAverage:
      genericNeededAverage.needed?.value ?? baseResult.neededAverage,
    needed: genericNeededAverage.needed
      ? [...baseResult.needed, genericNeededAverage.needed]
      : baseResult.needed,
    alerts: genericNeededAverage.alert
      ? [...(baseResult.alerts ?? []), genericNeededAverage.alert]
      : baseResult.alerts,
  };
}
