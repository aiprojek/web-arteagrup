// FIX: Replaced `import 'react';` with `import React from 'react';` to correctly bring the JSX types into scope.
import React from 'react';

export interface LinkItem {
  id: number;
  url: string;
  title: string;
  icon?: string;
}

export interface SocialLinkItem {
    id: number;
    url: string;
    name: string;
    icon: string;
}

export interface Theme {
  id: string;
  name: string;
  backgroundImage: string;
  accentColor: string;
  accentColorHover: string;
}

export interface LayoutItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}