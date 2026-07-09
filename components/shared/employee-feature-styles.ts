export type EmployeeFeatureTone = "blue" | "emerald" | "amber" | "violet";

export const employeeFeatureStyles: Record<
  EmployeeFeatureTone,
  {
    nav: string;
    navActive: string;
    home: string;
    icon: string;
  }
> = {
  blue: {
    nav: "border-blue-600 bg-blue-600 text-white shadow-blue-700/25 hover:border-blue-700 hover:bg-blue-700",
    navActive: "border-blue-950 bg-blue-800 text-white shadow-[inset_0_2px_6px_rgb(0_0_0_/_0.36)] hover:border-blue-950 hover:bg-blue-800",
    home: "border-blue-600 bg-blue-600 text-white shadow-blue-700/25 hover:border-blue-700 hover:bg-blue-700",
    icon: "bg-white/20 text-white ring-white/30",
  },
  emerald: {
    nav: "border-emerald-600 bg-emerald-600 text-white shadow-emerald-700/25 hover:border-emerald-700 hover:bg-emerald-700",
    navActive: "border-emerald-950 bg-emerald-800 text-white shadow-[inset_0_2px_6px_rgb(0_0_0_/_0.36)] hover:border-emerald-950 hover:bg-emerald-800",
    home: "border-emerald-600 bg-emerald-600 text-white shadow-emerald-700/25 hover:border-emerald-700 hover:bg-emerald-700",
    icon: "bg-white/20 text-white ring-white/30",
  },
  amber: {
    nav: "border-amber-500 bg-amber-500 text-white shadow-amber-700/25 hover:border-amber-600 hover:bg-amber-600",
    navActive: "border-amber-950 bg-amber-700 text-white shadow-[inset_0_2px_6px_rgb(0_0_0_/_0.34)] hover:border-amber-950 hover:bg-amber-700",
    home: "border-amber-500 bg-amber-500 text-white shadow-amber-700/25 hover:border-amber-600 hover:bg-amber-600",
    icon: "bg-white/25 text-white ring-white/35",
  },
  violet: {
    nav: "border-violet-600 bg-violet-600 text-white shadow-violet-700/25 hover:border-violet-700 hover:bg-violet-700",
    navActive: "border-violet-950 bg-violet-800 text-white shadow-[inset_0_2px_6px_rgb(0_0_0_/_0.36)] hover:border-violet-950 hover:bg-violet-800",
    home: "border-violet-600 bg-violet-600 text-white shadow-violet-700/25 hover:border-violet-700 hover:bg-violet-700",
    icon: "bg-white/20 text-white ring-white/30",
  },
};
