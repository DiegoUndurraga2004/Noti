export type EvaluationInputType = "grade" | "points" | "percent";

export type Evaluation = {
  id: string;
  name: string;
  inputType?: EvaluationInputType;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

export type WeightedItem = {
  evaluationId: string;
  weight: number;
};

export type Formula =
  | {
      type: "EVALUATION";
      evaluationId: string;
    }
  | {
      type: "AVERAGE";
      evaluationIds: string[];
    }
  | {
      type: "WEIGHTED_AVERAGE";
      items: WeightedItem[];
    }
  | {
      type: "TOP_N_AVERAGE";
      n: number;
      items: Formula[];
    }
  | {
      type: "EXAM_REPLACES_LOWEST_TESTS";
      testIds: string[];
      examId: string;
    }
  | {
      type: "POINTS_TO_GRADE";
      items: {
        evaluationId: string;
        maxPoints: number;
      }[];
      attendanceFactor?: {
        evaluationId: string;
        defaultFactor: number;
        thresholds: {
          min: number;
          factor: number;
        }[];
      };
      gate?: {
        evaluationId: string;
        minimum: number;
        failValue: number;
      };
    };

export type ComponentRule = {
  id: string;
  name: string;
  weight: number;
  minimum?: number;
  roundTo?: number;
  formula: Formula;
};

export type CourseRule =
  | {
      type: "WEIGHTED_AVERAGE";
      items: WeightedItem[];
    }
  | {
      type: "TOP_N_AVERAGE";
      n: number;
      items: Formula[];
    }
  | {
      type: "WEIGHTED_COMPONENTS";
      components: ComponentRule[];
      failStrategy?: "CAP_AT_3_9" | "MIN_COMPONENT" | "NONE";
      gateFailStrategy?: {
        type: "USE_COMPONENT_CAP";
        componentId: string;
        cap: number;
      };
    };

export type Course = {
  id: string;
  code: string;
  name: string;
  semester: string;
  passingGrade: number;
  formulaDescription: string;
  evaluations: Evaluation[];
  rule: CourseRule;
};

export const courses: Course[] = [
  {
    //Proba
    id: "probabilidades-estadistica-2026-1",
    code: "EYP1113",
    name: "Probabilidades y Estadística",
    semester: "2026-1",
    passingGrade: 3.95,
    formulaDescription:
      "NF = 80% PI + 20% PL. PI es el promedio de 4 interrogaciones. PL es el promedio de 2 talleres de R, con posible bonificación.",
    evaluations: [
      {
        id: "i1",
        name: "Interrogación 1",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "i2",
        name: "Interrogación 2",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "i3",
        name: "Interrogación 3",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "i4",
        name: "Interrogación 4",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "r1",
        name: "Taller R 1",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "r2",
        name: "Taller R 2",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
    ],
    rule: {
      type: "WEIGHTED_AVERAGE",
      items: [
        { evaluationId: "i1", weight: 20 },
        { evaluationId: "i2", weight: 20 },
        { evaluationId: "i3", weight: 20 },
        { evaluationId: "i4", weight: 20 },
        { evaluationId: "r1", weight: 10 },
        { evaluationId: "r2", weight: 10 },
      ],
    },
  },
  {
    //Discretas
    id: "matematicas-discretas-2026-1",
    code: "IIC1253",
    name: "Matemáticas Discretas",
    semester: "2026-1",
    passingGrade: 3.95,
    formulaDescription:
      "NF = promedio de las 3 mejores notas entre I1, I2, promedio de controles, examen y examen.",
    evaluations: [
      {
        id: "i1",
        name: "Interrogación 1",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "i2",
        name: "Interrogación 2",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "c1",
        name: "Control 1",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "c2",
        name: "Control 2",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "exam",
        name: "Examen",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
    ],
    rule: {
      type: "TOP_N_AVERAGE",
      n: 3,
      items: [
        { type: "EVALUATION", evaluationId: "i1" },
        { type: "EVALUATION", evaluationId: "i2" },
        { type: "AVERAGE", evaluationIds: ["c1", "c2"] },
        { type: "EVALUATION", evaluationId: "exam" },
        { type: "EVALUATION", evaluationId: "exam" },
      ],
    },
  },
  {
    //Electro
    id: "electricidad-magnetismo-2026-1",
    code: "FIS1533",
    name: "Electricidad y Magnetismo",
    semester: "2026-1",
    passingGrade: 4.0,
    formulaDescription:
      "NFC = 30% I1 + 30% I2 + 30% Examen + 10% Controles. Si NL >= 4.0 y NFC >= 4.0, NF = 70% NFC + 30% NL. Si no, NF = min(NFC, NL).",
    evaluations: [
      {
        id: "i1",
        name: "Interrogación 1",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "i2",
        name: "Interrogación 2",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "exam",
        name: "Examen",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "controls",
        name: "Promedio controles",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "lab",
        name: "Nota laboratorio",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
    ],
    rule: {
      type: "WEIGHTED_COMPONENTS",
      failStrategy: "MIN_COMPONENT",
      components: [
        {
          id: "nfc",
          name: "Nota cátedra NFC",
          weight: 0.7,
          minimum: 4.0,
          formula: {
            type: "WEIGHTED_AVERAGE",
            items: [
              { evaluationId: "i1", weight: 30 },
              { evaluationId: "i2", weight: 30 },
              { evaluationId: "exam", weight: 30 },
              { evaluationId: "controls", weight: 10 },
            ],
          },
        },
        {
          id: "lab",
          name: "Nota laboratorio NL",
          weight: 0.3,
          minimum: 4.0,
          formula: {
            type: "EVALUATION",
            evaluationId: "lab",
          },
        },
      ],
    },
  },
  {
    //M_Opti
    id: "metodos-optimizacion-2026-1",
    code: "ICS2121",
    name: "Métodos de Optimización",
    semester: "2026-1",
    passingGrade: 4.0,
    formulaDescription:
      "NF = 25% NT + 75% NP. NT es el promedio de 3 tareas. NP es el promedio de I1, I2 y Examen, donde el Examen reemplaza la peor interrogación si es mayor. Para aprobar, NT y NP deben ser al menos 4.0.",
    evaluations: [
      {
        id: "i1",
        name: "Interrogación 1",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "i2",
        name: "Interrogación 2",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "exam",
        name: "Examen",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "t1",
        name: "Tarea 1",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "t2",
        name: "Tarea 2",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "t3",
        name: "Tarea 3",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
    ],
    rule: {
      type: "WEIGHTED_COMPONENTS",
      failStrategy: "CAP_AT_3_9",
      components: [
        {
          id: "nt",
          name: "Promedio tareas NT",
          weight: 0.25,
          minimum: 4.0,
          roundTo: 1,
          formula: {
            type: "AVERAGE",
            evaluationIds: ["t1", "t2", "t3"],
          },
        },
        {
          id: "np",
          name: "Promedio pruebas NP",
          weight: 0.75,
          minimum: 4.0,
          roundTo: 1,
          formula: {
            type: "EXAM_REPLACES_LOWEST_TESTS",
            testIds: ["i1", "i2"],
            examId: "exam",
          },
        },
      ],
    },
  },
  {
    //BDD
    id: "bases-de-datos-2026-1",
    code: "IIC2413",
    name: "Bases de Datos",
    semester: "2026-1",
    passingGrade: 4.0,
    formulaDescription:
      "NF = 50% C + 50% P. C = (I1 + I2 + 1.5 × Examen) / 3.5. P depende del puntaje del proyecto, asistencia y prueba final del proyecto. Para aprobar: NF ≥ 4.0, C ≥ 3.9, P ≥ 3.9 y prueba proyecto ≥ 60%.",
    evaluations: [
      {
        id: "i1",
        name: "Interrogación 1",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "i2",
        name: "Interrogación 2",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "exam",
        name: "Examen",
        inputType: "grade",
        min: 1,
        max: 7,
        step: 0.1,
      },
      {
        id: "e1",
        name: "Proyecto etapa 1",
        inputType: "points",
        min: 0,
        max: 30,
        step: 0.1,
        unit: "/30 pts",
      },
      {
        id: "e2",
        name: "Proyecto etapa 2",
        inputType: "points",
        min: 0,
        max: 30,
        step: 0.1,
        unit: "/30 pts",
      },
      {
        id: "e3",
        name: "Proyecto etapa 3",
        inputType: "points",
        min: 0,
        max: 40,
        step: 0.1,
        unit: "/40 pts",
      },
      {
        id: "attendance",
        name: "Asistencia ayudantías",
        inputType: "percent",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
      {
        id: "projectTest",
        name: "Prueba proyecto",
        inputType: "percent",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
      },
    ],
    rule: {
      type: "WEIGHTED_COMPONENTS",
      failStrategy: "CAP_AT_3_9",
      gateFailStrategy: {
        type: "USE_COMPONENT_CAP",
        componentId: "catedra",
        cap: 3.9,
      },
      components: [
        {
          id: "catedra",
          name: "Promedio cátedra C",
          weight: 0.5,
          minimum: 3.9,
          formula: {
            type: "WEIGHTED_AVERAGE",
            items: [
              { evaluationId: "i1", weight: 1 },
              { evaluationId: "i2", weight: 1 },
              { evaluationId: "exam", weight: 1.5 },
            ],
          },
        },
        {
          id: "proyecto",
          name: "Nota proyecto P",
          weight: 0.5,
          minimum: 3.9,
          formula: {
            type: "POINTS_TO_GRADE",
            items: [
              { evaluationId: "e1", maxPoints: 30 },
              { evaluationId: "e2", maxPoints: 30 },
              { evaluationId: "e3", maxPoints: 40 },
            ],
            attendanceFactor: {
              evaluationId: "attendance",
              defaultFactor: 0.7,
              thresholds: [
                { min: 100, factor: 1.05 },
                { min: 70, factor: 1.0 },
                { min: 60, factor: 0.9 },
                { min: 50, factor: 0.8 },
              ],
            },
            gate: {
              evaluationId: "projectTest",
              minimum: 60,
              failValue: 1,
            },
          },
        },
      ],
    },
  },
];
