export type EmployeeFeatureTone = "blue" | "emerald" | "amber" | "violet";

export const employeeFeatureStyles: Record<
  EmployeeFeatureTone,
  {
    home: string;
    icon: string;
  }
> = {
  blue: {
    home: "border-blue-800 bg-blue-700 text-white shadow-blue-950/20 hover:bg-blue-800",
    icon: "bg-white/15 text-white ring-white/30",
  },
  emerald: {
    home: "border-emerald-800 bg-emerald-700 text-white shadow-emerald-950/20 hover:bg-emerald-800",
    icon: "bg-white/15 text-white ring-white/30",
  },
  amber: {
    home: "border-amber-800 bg-amber-700 text-white shadow-amber-950/20 hover:bg-amber-800",
    icon: "bg-white/15 text-white ring-white/30",
  },
  violet: {
    home: "border-violet-800 bg-violet-700 text-white shadow-violet-950/20 hover:bg-violet-800",
    icon: "bg-white/15 text-white ring-white/30",
  },
};
