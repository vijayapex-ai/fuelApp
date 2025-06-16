import React from 'react';

const FuelIcon = ({ size = 24, color = '#EF4444' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 22C12 22 18 12 18 8.5C18 5.1 15 2 12 2C9 2 6 5.1 6 8.5C6 12 12 22 12 22Z"
      fill={color}
    />
    <path
      d="M10.5 8.5C10.5 7.67157 11.1716 7 12 7C12.8284 7 13.5 7.67157 13.5 8.5C13.5 9.32843 12.8284 10 12 10C11.1716 10 10.5 9.32843 10.5 8.5Z"
      fill="white"
    />
  </svg>
);

export default FuelIcon;
