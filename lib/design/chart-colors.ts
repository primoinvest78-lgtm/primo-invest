/**
 * Sequência cromática única para gráficos e indicadores.
 * Espelha os tokens --chart-1..5 de globals.css — mantida como
 * array porque Recharts/SVG precisam de valores resolvidos por item.
 * Verde-menta como cor principal (chart-1), variações compatíveis
 * em azul-marinho e cinza neutro nas demais posições.
 */
export const CHART_SEQUENCE = [
  "#2ecc9b",
  "#101b3d",
  "#34d399",
  "#6b7280",
  "#122b54",
] as const;
