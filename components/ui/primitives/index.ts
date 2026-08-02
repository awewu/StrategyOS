/**
 * StratOS UI primitives (Track B) — token-bound, dependency-free base layer.
 * Import from here: `import { Button, Card, Badge } from "@/components/ui/primitives";`
 */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./Button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
  type CardProps,
  type CardTone,
} from "./Card";
export { Badge, type BadgeProps, type BadgeTone } from "./Badge";
export { Input, type InputProps, type InputSize, type InputTone } from "./Input";
export { Textarea, type TextareaProps, type TextareaSize, type TextareaTone } from "./Textarea";
export { Select, type SelectProps, type SelectSize, type SelectTone, type SelectShape } from "./Select";
export { Tabs, type TabsProps, type TabItem, type TabsVariant, type TabsSize } from "./Tabs";
export { Tooltip, type TooltipProps, type TooltipSide } from "./Tooltip";
