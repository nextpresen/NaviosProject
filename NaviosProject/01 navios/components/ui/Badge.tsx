type Variant = "gray" | "green" | "red" | "blue" | "yellow";

type Props = {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
};

const variantStyles: Record<Variant, string> = {
  gray: "bg-slate-100 text-slate-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

export function Badge({ variant = "gray", children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
