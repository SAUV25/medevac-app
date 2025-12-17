
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, onClick }) => {
    return (
        <div 
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-md dark:border dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-300 ${className}`}
            onClick={onClick}
        >
            {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>}
            {children}
        </div>
    );
};

export default Card;
