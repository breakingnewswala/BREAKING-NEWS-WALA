import React, { useState } from 'react';
import { X, MapPin, Search, Check } from 'lucide-react';

interface DistrictSelectorModalProps {
  districts: string[];
  currentDistrict: string;
  onSelectDistrict: (district: string) => void;
  onClose: () => void;
}

export const DistrictSelectorModal: React.FC<DistrictSelectorModalProps> = ({
  districts,
  currentDistrict,
  onSelectDistrict,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDistricts = districts.filter(d => 
    d.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">अपना जिला चुनें (Select District)</h3>
              <p className="text-xs text-gray-500">मध्य प्रदेश एवं बुंदेलखंड विशेष</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="जिला खोजें (उदा. निवाड़ी, भोपाल, इंदौर)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Districts List */}
        <div className="p-3 overflow-y-auto divide-y divide-gray-100 flex-1">
          <button
            onClick={() => {
              onSelectDistrict('सभी जिले');
              onClose();
            }}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs sm:text-sm font-bold transition ${
              currentDistrict === 'सभी जिले' ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-800'
            }`}
          >
            <span>सभी जिले (सम्पूर्ण राज्य कवरेज)</span>
            {currentDistrict === 'सभी जिले' && <Check className="w-4 h-4 text-red-600" />}
          </button>

          {filteredDistricts.map(dist => {
            const isSelected = currentDistrict === dist;
            return (
              <button
                key={dist}
                onClick={() => {
                  onSelectDistrict(dist);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs sm:text-sm transition ${
                  isSelected ? 'bg-amber-50 font-bold text-red-700' : 'hover:bg-gray-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-red-600' : 'text-gray-400'}`} />
                  <span>{dist}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-red-600" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
