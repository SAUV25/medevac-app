
import React from 'react';
import Card from './Card';

interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, color }) => {
    return (
        <Card className="flex items-center">
            <div className={`p-3 rounded-full mr-4`} style={{ backgroundColor: `${color}20` }}>
                <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </Card>
    );
};

export default MetricCard;
