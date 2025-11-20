export enum LayoutMode {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

export enum SidebarState {
  STANDARD = 'standard',
  CONDENSED = 'condensed',
  HIDDEN = 'hidden'
}

export interface LayoutConfig {
  mode: LayoutMode;
  sidebarState: SidebarState;
}

