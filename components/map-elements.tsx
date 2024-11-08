import React, { useState } from 'react';
import Draggable from 'react-draggable';

interface MapElementsProps {
  title: string;
  scale: number;
  onExport: () => void;
}

const MapElements = ({ title: initialTitle, scale, onExport }: MapElementsProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [legendTitle, setLegendTitle] = useState('图例');
  const [isEditingLegend, setIsEditingLegend] = useState(false);
  const [items, setItems] = useState([
    { icon: '/fire-truck.svg', label: '消防车' },
    { icon: '/fire-point.svg', label: '火灾点' },
    { text: '行驶路线', color: 'bg-red-500' }
  ]);

  const handleLabelEdit = (index: number, newLabel: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], label: newLabel };
    setItems(newItems);
  };

  return (
    <div className="absolute inset-0 map-elements" style={{ zIndex: 1000 }}>
      {/* 地图标题 */}
      <Draggable bounds="parent">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 px-4 py-2 rounded-lg pointer-events-auto cursor-move">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="text-xl font-bold text-black bg-transparent outline-none"
              autoFocus
            />
          ) : (
            <h1 
              className="text-xl font-bold text-black"
              onClick={() => setIsEditingTitle(true)}
            >
              {title}
            </h1>
          )}
        </div>
      </Draggable>

      {/* 图例 */}
      <Draggable bounds="parent">
        <div className="absolute bottom-20 right-4 bg-white/80 p-4 rounded-lg pointer-events-auto cursor-move">
          {isEditingLegend ? (
            <input
              type="text"
              value={legendTitle}
              onChange={(e) => setLegendTitle(e.target.value)}
              onBlur={() => setIsEditingLegend(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingLegend(false)}
              className="font-bold mb-2 text-black bg-transparent outline-none"
              autoFocus
            />
          ) : (
            <h3 
              className="font-bold mb-2 text-black"
              onClick={() => setIsEditingLegend(true)}
            >
              {legendTitle}
            </h3>
          )}
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-4 h-${'color' in item ? '1' : '4'}`}>
                  {'icon' in item ? (
                    <img src={item.icon} alt={item.label} className="w-full h-full" />
                  ) : (
                    <div className={`w-full h-full ${item.color}`}></div>
                  )}
                </div>
                <span
                  className="text-sm text-black cursor-text"
                  onClick={(e) => {
                    const input = document.createElement('input');
                    input.value = item.label;
                    input.className = 'text-sm text-black bg-transparent outline-none';
                    input.onblur = () => {
                      handleLabelEdit(index, input.value);
                      e.currentTarget.replaceWith(input.value);
                    };
                    input.onkeydown = (ke) => {
                      if (ke.key === 'Enter') {
                        input.blur();
                      }
                    };
                    e.currentTarget.replaceWith(input);
                    input.focus();
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Draggable>

      {/* 指北针 */}
      <Draggable bounds="parent">
        <div className="absolute top-20 right-4 bg-white/80 p-2 rounded-lg pointer-events-auto cursor-move">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <path d="M20 0 L24 20 L20 40 L16 20 Z" fill="black"/>
            <text x="20" y="15" textAnchor="middle" fill="white">N</text>
          </svg>
        </div>
      </Draggable>

      {/* 比例尺 */}
      <Draggable bounds="parent">
        <div className="absolute bottom-4 left-4 bg-white/80 px-4 py-2 rounded-lg pointer-events-auto cursor-move">
          <div className="flex items-center gap-2">
            <div className="w-20 h-1 bg-black"></div>
            <span className="text-sm text-black">{scale}km</span>
          </div>
        </div>
      </Draggable>

      {/* 导出按钮 */}
      <button 
        onClick={onExport}
        className="z-50 absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg pointer-events-auto no-export"
      >
        导出地图
      </button>
    </div>
  );
};

export default MapElements;