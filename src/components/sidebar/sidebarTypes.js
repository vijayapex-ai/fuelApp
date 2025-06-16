// Define MenuItemChild type
export const MenuItemChild = {
  name: String,
  path: String,
  icon: ReactNode,
};

// Define MenuItem type
export const MenuItem = {
  name: String,
  path: String,
  icon: ReactNode,
  children: Array, // Optional array of MenuItemChild
};
