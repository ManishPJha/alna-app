interface SubMenuItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    activePattern: RegExp;
}

export interface NavigationItem {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    activePattern?: RegExp;
    subItems?: SubMenuItem[];
}
