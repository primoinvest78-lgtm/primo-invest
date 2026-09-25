"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

/**
 * Abas com nomes sempre legíveis: cada nome fica num cartão azul-marinho
 * (texto claro) e a aba ativa em verde-menta — nenhum nome "transparente"
 * sobre o fundo. Vale para todas as abas do sistema.
 */
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit max-w-full flex-wrap items-center gap-2 group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        line: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-secondary px-3.5 py-2 text-sm font-semibold whitespace-nowrap text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_6px_14px_-8px_rgba(16,27,61,0.6)] transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_0_0_1px_rgba(46,204,155,0.35),0_10px_20px_-10px_rgba(46,204,155,0.55)]",
        "data-active:border-primary data-active:bg-primary data-active:text-primary-foreground data-active:shadow-[0_0_0_1px_rgba(46,204,155,0.6),0_10px_22px_-10px_rgba(46,204,155,0.8)]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60",
        "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
