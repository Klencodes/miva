
export type TableColumnType = "column" | "status" | "date" | "image";

export interface ImageConfig {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  altText?: (item: any) => string;
}

export interface TableColumn {
  header: string;
  value: (item: any) => any;
  type?: TableColumnType;
  align?: "left" | "center" | "right";
  link?: (item: any) => string | string[];
  onClick?: (item: any) => void;
  bold?: boolean;
  statusClasses?: (item: any) => string;
  format?: string;
  imageConfig?: ImageConfig;
}

export interface CustomAction {
  title: string;
  icon: string;
  handler: (item: any) => void;
  classes?: string;
}

export interface PaginationProps {
  page: number;
  limit: number;
  count: number;
  onPageChange: (page: number) => void;
}
