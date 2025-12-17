
// FIX: Replaced placeholder content with a functional StyleGuide component.
import React from 'react';
import Card from '../../components/Card';
import { Plus, Edit, Trash2 } from 'lucide-react';

const StyleGuide: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Style Guide</h1>

            <Card title="Colors">
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded bg-primary"></div>
                        <span>Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded bg-success"></div>
                        <span>Success</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded bg-danger"></div>
                        <span>Danger</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded bg-warning"></div>
                        <span>Warning</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded bg-info"></div>
                        <span>Info</span>
                    </div>
                </div>
            </Card>
            
            <Card title="Buttons">
                <div className="flex flex-wrap gap-4 items-center">
                    <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">Primary</button>
                    <button className="px-4 py-2 bg-success text-white rounded-md hover:bg-success/90">Success</button>
                    <button className="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90">Danger</button>
                    <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Secondary</button>
                    <button className="px-4 py-2 bg-primary text-white rounded-md opacity-50 cursor-not-allowed">Disabled</button>
                </div>
                 <div className="flex flex-wrap gap-4 items-center mt-4">
                     <button className="p-2 text-primary rounded-full hover:bg-primary/10"><Edit size={18}/></button>
                     <button className="p-2 text-danger rounded-full hover:bg-danger/10"><Trash2 size={18}/></button>
                     <button className="p-2 text-gray-500 rounded-full hover:bg-gray-100"><Plus size={18}/></button>
                </div>
            </Card>

            <Card title="Form Elements">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Input Field</label>
                        <input type="text" placeholder="Enter text..." className="mt-1 block w-full input border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Textarea</label>
                        <textarea rows={3} placeholder="Enter text..." className="mt-1 block w-full input border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary px-3 py-2" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Select</label>
                         <select className="mt-1 block w-full input border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary px-3 py-2">
                            <option>Option 1</option>
                            <option>Option 2</option>
                        </select>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default StyleGuide;
