export type EmployeeFeatureTone = "blue" | "emerald" | "amber" | "violet";

export const employeeFeatureStyles: Record<
  EmployeeFeatureTone,
  {
    nav: string;
    home: string;
    icon: string;
  }
> = {
  blue: {
    nav: "border-blue-600 bg-blue-600 text-white shadow-blue-700/25 hover:border-blue-700 hover:bg-blue-700",
    home: "border-blue-600 bg-blue-600 text-white shadow-blue-700/25 hover:border-blue-700 hover:bg-blue-700",
    icon: "bg-white/20 text-white ring-white/30",
  },
  emerald: {
    nav: "border-emerald-600 bg-emerald-600 text-white shadow-emerald-700/25 hover:border-emerald-700 hover:bg-emerald-700",
    home: "border-emerald-600 bg-emerald-600 text-white shadow-emerald-700/25 hover:border-emerald-700 hover:bg-emerald-700",
    icon: "bg-white/20 text-white ring-white/30",
  },
  amber: {
    nav: "border-amber-500 bg-amber-500 text-amber-950 shadow-amber-700/25 hover:border-amber-600 hover:bg-amber-600",
    home: "border-amber-500 bg-amber-500 text-amber-950 shadow-amber-700/25 hover:border-amber-600 hover:bg-amber-600",
    icon: "bg-white/25 text-amber-950 ring-white/35",
  },
  violet: {
    nav: "border-violet-600 bg-violet-600 text-white shadow-violet-700/25 hover:border-violet-700 hover:bg-violet-700",
    home: "border-violet-600 bg-violet-600 text-white shadow-violet-700/25 hover:border-violet-700 hover:bg-violet-700",
    icon: "bg-white/20 text-white ring-white/30",
  },
};
