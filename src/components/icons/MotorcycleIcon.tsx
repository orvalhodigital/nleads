import React from 'react';

interface MotorcycleIconProps {
    size?: number | string;
    className?: string;
    strokeWidth?: number;
}

export const MotorcycleIcon: React.FC<MotorcycleIconProps> = ({
    size = 24,
    className = '',
    strokeWidth = 2,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Roda Traseira */}
        <circle cx="5" cy="16" r="3" />
        {/* Roda Dianteira */}
        <circle cx="19" cy="16" r="3" />
        {/* Guidão e Painel */}
        <path d="M14 6h3.5l-2.5 4" />
        {/* Tanque, Assento e Carenagem */}
        <path d="M7 11.5c1.5-2 3.5-2.5 5.5-2.5h3.5l2 3H9.5z" />
        {/* Quadro conectando as rodas */}
        <path d="M5 16l4-4.5h6.5l3.5 4.5" />
        {/* Escapamento / Bloco */}
        <path d="M8.5 16v-2h4.5v2" />
    </svg>
);

export default MotorcycleIcon;
