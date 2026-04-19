/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Database, 
  FileText, 
  Search, 
  X, 
  ChevronRight,
  Download,
  Package,
  Save,
  Clock
} from 'lucide-react';
import { Item, EstimateLineItem, Estimate, MEASURING_UNITS } from './types';

// Initial dummy data for the first visit
const INITIAL_ITEMS: Item[] = [
  { id: '1', name: 'Cement Bag', unit: 'bag', rate: 450, requiresSize: false },
  { id: '2', name: 'Steel Rod (10mm)', unit: 'kg', rate: 85, requiresSize: false },
  { id: '3', name: 'Brick', unit: 'nos', rate: 12, requiresSize: false },
  { id: '4', name: 'Sand', unit: 'sq.ft', rate: 60, requiresSize: true },
  { id: '5', name: 'Timber Planks', unit: 'sq.mtr', rate: 1200, requiresSize: true },
];

export default function App() {
  // Persistence state
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('estimate_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [estimates, setEstimates] = useState<Estimate[]>(() => {
    const saved = localStorage.getItem('estimate_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Current Working State
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [salespersonName, setSalespersonName] = useState('');
  const [estimateLines, setEstimateLines] = useState<EstimateLineItem[]>([]);
  const [freightCharge, setFreightCharge] = useState<number>(0);
  const [labourCharge, setLabourCharge] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'create' | 'database' | 'history'>('create');
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState<'date' | 'client'>('date');
  const [viewingEstimate, setViewingEstimate] = useState<Estimate | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Item>>({ name: '', unit: 'nos', rate: 0 });

  const nextEstimateNo = useMemo(() => {
    const today = new Date();
    const dateStr = today.toLocaleDateString();
    const todayEstimatesCount = estimates.filter(e => e.date === dateStr).length;
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}-${String(todayEstimatesCount + 1).padStart(3, '0')}`;
  }, [estimates]);

  const PrintableDocument = ({ data, estNo }: { data: Partial<Estimate>, estNo: string }) => (
    <div className="flex-1 overflow-y-auto p-12 md:p-20 bg-white" id="printable-document">
      <div className="flex justify-between items-start mb-4 border-b border-ink/10 pb-6">
        <div className="max-w-md">
           <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-0.5 border-b border-line/20 pb-1">Billing Information</span>
           <h3 className="italic-serif text-3xl mb-0.5 leading-tight">{data.clientName || 'Unnamed Client'}</h3>
           <div className="space-y-0.5 text-xs opacity-60 font-medium">
             {data.clientAddress && <p>{data.clientAddress}</p>}
             {data.clientContact && <p>{data.clientContact}</p>}
           </div>
           
           <div className="mt-4">
             <div>
               <span className="text-[9px] uppercase font-bold opacity-40 block mb-0.5">Sales Representative</span>
               <span className="text-xs font-bold">{data.salespersonName || '—'}</span>
             </div>
           </div>
        </div>
        
        <div className="text-right">
           <h2 className="italic-serif text-6xl tracking-tighter opacity-10 mb-4 uppercase">Estimate</h2>
           <div className="space-y-4">
             <div>
               <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-1">Number</span>
               <span className="font-bold text-2xl">{estNo}</span>
             </div>
             <div>
               <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 block mb-1">Date of Issue</span>
               <span className="font-bold">{data.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
             </div>
           </div>
        </div>
      </div>

      <table className="w-full mb-16">
        <thead>
          <tr className="border-b border-ink/10">
            <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest opacity-40">Item Details</th>
            <th className="text-center py-2 text-[10px] font-bold uppercase tracking-widest opacity-40">Unit</th>
            <th className="text-center py-2 text-[10px] font-bold uppercase tracking-widest opacity-40">Dimension</th>
            <th className="text-right py-2 text-[10px] font-bold uppercase tracking-widest opacity-40">Qty</th>
            <th className="text-right py-2 text-[10px] font-bold uppercase tracking-widest opacity-40">Rate</th>
            <th className="text-right py-2 text-[10px] font-bold uppercase tracking-widest opacity-40">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items?.map(line => (
            <tr key={line.id} className="border-b border-ink/20">
              <td className="py-2">
                 <div className="font-bold italic-serif text-lg">{line.name}</div>
                 <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-70">{line.subDescription || 'Basic configuration'}</div>
              </td>
              <td className="py-2 text-center text-xs font-bold opacity-60">{line.unit}</td>
              <td className="py-2 text-center text-[10px] font-mono opacity-50">
                 {line.requiresSize ? `${line.length} × ${line.width} ${line.useInches ? 'in' : 'ft'}` : '—'}
              </td>
              <td className="py-2 text-right font-bold">{line.quantity}</td>
              <td className="py-2 text-right opacity-60 text-xs">₹{line.rate.toLocaleString()}</td>
              <td className="py-2 text-right font-bold">
                 ₹{(line.rate * line.quantity * (line.requiresSize ? ((line.length || 1) * (line.width || 1) / (line.useInches ? 144 : 1)) : 1)).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
         <div className="w-full max-w-xs space-y-4">
            {(data.freightCharge || 0) > 0 && (
              <div className="flex justify-between items-baseline opacity-60">
                <span className="italic-serif text-lg">Freight Charges</span>
                <span className="font-bold">₹{data.freightCharge?.toLocaleString()}</span>
              </div>
            )}
            {(data.labourCharge || 0) > 0 && (
              <div className="flex justify-between items-baseline opacity-60">
                <span className="italic-serif text-lg">Service/Labour</span>
                <span className="font-bold">₹{data.labourCharge?.toLocaleString()}</span>
              </div>
            )}
            {(data.discount || 0) > 0 && (
              <div className="flex justify-between items-baseline text-red-500 opacity-80">
                <span className="italic-serif text-lg">Applied Discount</span>
                <span className="font-bold">-₹{data.discount?.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t-2 border-ink pt-6 flex justify-between items-baseline">
               <span className="italic-serif text-2xl text-accent">Total Valuation</span>
               <span className="italic-serif text-5xl">₹{data.total?.toLocaleString()}</span>
            </div>
         </div>
      </div>

      {/* Footer Area with just total at bottom of first section */}
    </div>
  );

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('estimate_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('estimate_history', JSON.stringify(estimates));
  }, [estimates]);

  // Derived Values
  const total = useMemo(() => {
    const rawTotal = estimateLines.reduce((acc, curr) => {
      const area = (curr.length || 1) * (curr.width || 1);
      const sizeMultiplier = curr.requiresSize ? (area / (curr.useInches ? 144 : 1)) : 1;
      return acc + (curr.rate * curr.quantity * sizeMultiplier);
    }, 0);
    return Math.round(rawTotal + (Number(freightCharge) || 0) + (Number(labourCharge) || 0) - (Number(discount) || 0));
  }, [estimateLines, freightCharge, labourCharge, discount]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const filteredHistory = useMemo(() => {
    let result = [...estimates];
    
    // Filtering
    if (historySearch) {
      result = result.filter(est => 
        est.clientName.toLowerCase().includes(historySearch.toLowerCase()) ||
        est.estimateNumber.toLowerCase().includes(historySearch.toLowerCase())
      );
    }

    // Sorting
    if (historySort === 'client') {
      result.sort((a, b) => a.clientName.localeCompare(b.clientName));
    } else {
      // Keep natural reverse-chronological order from the array
    }
    
    return result;
  }, [estimates, historySearch, historySort]);

  // Handlers
  const handleAddItemToDb = () => {
    if (!newItem.name || !newItem.unit || newItem.rate === undefined) return;
    const item: Item = {
      id: crypto.randomUUID(),
      name: newItem.name,
      unit: newItem.unit,
      rate: Number(newItem.rate),
      requiresSize: newItem.requiresSize || false,
      useInches: newItem.useInches || false
    };
    setItems(prev => [...prev, item]);
    setIsAddingItem(false);
    setNewItem({ name: '', unit: 'nos', rate: 0, requiresSize: false, useInches: false });
  };

  const handleDeleteFromDb = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleAddLine = (item: Item) => {
    const existing = estimateLines.find(l => l.itemId === item.id);
    if (existing) {
      setEstimateLines(prev => prev.map(l => 
        l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l
      ));
    } else {
      setEstimateLines(prev => [...prev, {
        id: crypto.randomUUID(),
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        rate: item.rate,
        quantity: 1,
        requiresSize: item.requiresSize,
        useInches: item.useInches,
        subDescription: ''
      }]);
    }
  };

  const handleUpdateLine = (id: string, updates: Partial<EstimateLineItem>) => {
    setEstimateLines(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleRemoveLine = (id: string) => {
    setEstimateLines(prev => prev.filter(l => l.id !== id));
  };

  const handleSaveEstimate = () => {
    if (!clientName || estimateLines.length === 0) return;
    const newEstimate: Estimate = {
      id: crypto.randomUUID(),
      estimateNumber: nextEstimateNo,
      clientName,
      clientAddress,
      clientContact,
      salespersonName,
      date: new Date().toLocaleDateString(),
      items: estimateLines,
      freightCharge,
      labourCharge,
      discount,
      total
    };
    setEstimates(prev => [newEstimate, ...prev]);
    setClientName('');
    setClientAddress('');
    setClientContact('');
    setSalespersonName('');
    setEstimateLines([]);
    setFreightCharge(0);
    setLabourCharge(0);
    setDiscount(0);
    setActiveTab('history');
  };

  const handlePrint = () => {
    // Set document title temporarily to control the suggested PDF filename
    const originalTitle = document.title;
    const nameForFile = viewingEstimate?.clientName || clientName || 'Unnamed_Client';
    const numForFile = viewingEstimate?.estimateNumber || nextEstimateNo;
    
    document.title = `Estimate_${nameForFile.replace(/\s+/g, '_')}_${numForFile}`;
    
    window.print();
    
    // Restore title after a brief delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col print:bg-white print:text-black">
      {/* Header - Artistic Flair Style */}
      <header className="px-10 py-10 flex justify-between items-baseline border-b border-ink print:px-0">
        <div className="flex flex-col gap-2">
          <div className="italic-serif text-2xl tracking-tighter">EstiMate Pro</div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">Precision Billing & Archives</div>
        </div>
        
        <div className="flex gap-8 print:hidden">
          <button 
            onClick={() => setActiveTab('create')}
            className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all ${activeTab === 'create' ? 'border-b-2 border-accent text-ink' : 'opacity-40 hover:opacity-100'}`}
          >
            Draft
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all ${activeTab === 'database' ? 'border-b-2 border-accent text-ink' : 'opacity-40 hover:opacity-100'}`}
          >
            Library
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`text-xs font-bold uppercase tracking-widest pb-1 transition-all ${activeTab === 'history' ? 'border-b-2 border-accent text-ink' : 'opacity-40 hover:opacity-100'}`}
          >
            Archive
          </button>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Estimate No.</div>
          <div className="italic-serif text-5xl font-medium leading-none -mt-1 tracking-tighter">
            {nextEstimateNo}
          </div>
          <div className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-60 mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'create' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 grid grid-cols-1 lg:grid-cols-12 h-full"
            >
              {/* Form Section */}
              <div className="lg:col-span-9 p-8 lg:p-12 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-2 block tracking-widest">Prepared For</label>
                      <input 
                        type="text" 
                        placeholder="Client or Project Name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-transparent border-b border-line focus:border-accent outline-none italic-serif text-4xl py-1 transition-colors"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-1 block">Address</label>
                          <input 
                            type="text" 
                            placeholder="Client Street, City, State"
                            value={clientAddress}
                            onChange={(e) => setClientAddress(e.target.value)}
                            className="w-full bg-transparent border-b border-line/20 focus:border-accent outline-none text-xs font-medium py-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-1 block">Contact Details</label>
                          <input 
                            type="text" 
                            placeholder="Email or Phone Number"
                            value={clientContact}
                            onChange={(e) => setClientContact(e.target.value)}
                            className="w-full bg-transparent border-b border-line/20 focus:border-accent outline-none text-xs font-medium py-1"
                          />
                        </div>
                      </div>
                      <div className="mt-8 flex items-center gap-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Managed By:</label>
                        <input 
                          type="text" 
                          placeholder="Salesperson Name"
                          value={salespersonName}
                          onChange={(e) => setSalespersonName(e.target.value)}
                          className="bg-transparent border-b border-line/20 focus:border-accent outline-none text-[10px] font-bold uppercase tracking-widest w-48"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <button 
                        onClick={() => setIsPreviewing(true)}
                        disabled={estimateLines.length === 0}
                        className="flex items-center gap-2 px-6 py-3 border border-line rounded-full hover:bg-accent/10 transition-colors disabled:opacity-20 text-xs font-bold uppercase tracking-widest"
                      >
                        <Printer size={16} /> Preview & Print
                      </button>
                      <button 
                        onClick={handleSaveEstimate}
                        disabled={!clientName || estimateLines.length === 0}
                        className="px-6 py-3 bg-ink text-bg text-xs font-bold uppercase tracking-widest rounded-full hover:bg-ink/90 transition-all disabled:opacity-20"
                      >
                        Save & Archive
                      </button>
                    </div>
                  </div>

                  {/* Line items table */}
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="col-header text-left py-3" style={{ width: '40%' }}>Item Description</th>
                        <th className="col-header text-left py-3" style={{ width: '10%' }}>Unit</th>
                        <th className="col-header text-center py-3" style={{ width: '15%' }}>Size (L x W)</th>
                        <th className="col-header text-right py-3" style={{ width: '8%' }}>Qty</th>
                        <th className="col-header text-right py-3" style={{ width: '12%' }}>Rate</th>
                        <th className="col-header text-right py-3" style={{ width: '15%' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimateLines.map((line) => (
                        <tr key={line.id} className="data-row group">
                          <td className="py-6 pr-4">
                            <div className="italic-serif text-2xl">{line.name}</div>
                            <input 
                              type="text" 
                              placeholder="Add Sub-description or Ref No."
                              value={line.subDescription || ''}
                              onChange={(e) => handleUpdateLine(line.id, { subDescription: e.target.value })}
                              className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none text-[10px] font-bold uppercase tracking-widest opacity-40 placeholder:opacity-20"
                            />
                          </td>
                          <td className="py-6">
                            <span className="unit-tag">{line.unit}</span>
                          </td>
                          <td className="py-6 text-center">
                            {line.requiresSize ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1 text-[11px] font-mono">
                                  <input 
                                    type="number" 
                                    value={line.length || ''}
                                    onChange={(e) => handleUpdateLine(line.id, { length: Number(e.target.value) || undefined })}
                                    className="bg-accent/5 w-10 text-center py-0.5 rounded outline-none border border-transparent focus:border-accent/30"
                                  />
                                  <span className="opacity-30">×</span>
                                  <input 
                                    type="number" 
                                    value={line.width || ''}
                                    onChange={(e) => handleUpdateLine(line.id, { width: Number(e.target.value) || undefined })}
                                    className="bg-accent/5 w-10 text-center py-0.5 rounded outline-none border border-transparent focus:border-accent/30"
                                  />
                                </div>
                                <span className="text-[8px] uppercase font-bold tracking-tighter opacity-40">{line.useInches ? 'Inches' : 'Feet'}</span>
                              </div>
                            ) : <span className="opacity-20">—</span>}
                          </td>
                          <td className="py-6 text-right">
                            <input 
                              type="number" 
                              value={line.quantity}
                              onChange={(e) => handleUpdateLine(line.id, { quantity: Number(e.target.value) })}
                              className="bg-transparent text-right w-10 font-bold outline-none border-b border-transparent focus:border-line group-hover:bg-accent/5 rounded px-1"
                            />
                          </td>
                          <td className="py-6 text-right">
                            <div className="flex items-center justify-end gap-1 font-mono text-sm opacity-60">
                              <span className="text-[10px]">₹</span>
                              <input 
                                type="number" 
                                value={line.rate}
                                onChange={(e) => handleUpdateLine(line.id, { rate: Number(e.target.value) })}
                                className="bg-transparent text-right w-16 outline-none border-b border-transparent focus:border-line group-hover:bg-accent/5 rounded px-1"
                              />
                            </div>
                          </td>
                          <td className="py-6 text-right relative group-hover:pr-8 transition-all">
                            <span className="font-bold tracking-tight">
                              ₹{(line.rate * line.quantity * (line.requiresSize ? ((line.length || 1) * (line.width || 1) / (line.useInches ? 144 : 1)) : 1)).toLocaleString()}
                            </span>
                            <button 
                              onClick={() => handleRemoveLine(line.id)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-all print:hidden"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {estimateLines.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-24 text-center opacity-20 italic-serif text-3xl">
                            Start adding items from the library
                          </td>
                        </tr>
                      )}

                      {estimateLines.length > 0 && (
                        <>
                          <tr className="border-b border-line">
                            <td colSpan={5} className="py-4 text-right italic-serif pr-8 opacity-60">Freight / Transport Charges</td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-mono text-xs opacity-30">₹</span>
                                <input 
                                  type="number" 
                                  value={freightCharge || ''}
                                  onChange={(e) => setFreightCharge(Number(e.target.value) || 0)}
                                  placeholder="0"
                                  className="bg-transparent text-right w-24 font-mono font-bold outline-none border-b border-transparent focus:border-line"
                                />
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-line">
                            <td colSpan={5} className="py-4 text-right italic-serif pr-8 opacity-60">Labour / Service Charges</td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-mono text-xs opacity-30">₹</span>
                                <input 
                                  type="number" 
                                  value={labourCharge || ''}
                                  onChange={(e) => setLabourCharge(Number(e.target.value) || 0)}
                                  placeholder="0"
                                  className="bg-transparent text-right w-24 font-mono font-bold outline-none border-b border-transparent focus:border-line"
                                />
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b border-line">
                            <td colSpan={5} className="py-4 text-right italic-serif pr-8 text-red-500 opacity-60">Discount Amount</td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-mono text-xs text-red-500 opacity-30">₹</span>
                                <input 
                                  type="number" 
                                  value={discount || ''}
                                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                  placeholder="0"
                                  className="bg-transparent text-right w-24 font-mono font-bold text-red-500 outline-none border-b border-transparent focus:border-line"
                                />
                              </div>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Lib Section */}
              <div className="lg:col-span-3 bg-white/50 p-6 lg:p-8 overflow-y-auto print:hidden border-l border-line flex flex-col">
                <div className="flex flex-col gap-4 mb-8">
                  <h3 className="italic-serif text-xl">Quick Library</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink opacity-20" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-accent/5 border border-line/30 rounded-full pl-9 pr-4 py-2 text-xs outline-none focus:border-accent group transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-2 custom-scrollbar overflow-y-auto pr-2">
                  {filteredItems.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => handleAddLine(item)}
                      className="w-full text-left p-4 rounded-xl border border-line hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all group relative bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-xs leading-tight mb-1">{item.name}</div>
                          <div className="text-[10px] opacity-40 uppercase tracking-tighter">₹{item.rate} / {item.unit}</div>
                        </div>
                        <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setActiveTab('database')}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 border border-dashed border-line rounded-xl text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 hover:border-accent hover:text-accent transition-all"
                >
                  <Database size={12} /> Manage Library
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'database' && (
            <motion.div 
              key="database"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-12 lg:p-24 overflow-y-auto"
            >
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-4">
                  <h2 className="italic-serif text-5xl tracking-tighter">Your Library</h2>
                  <button 
                    onClick={() => setIsAddingItem(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-accent/20 text-accent text-xs font-bold uppercase tracking-widest rounded-full hover:bg-accent/30 transition-all border border-accent/20"
                  >
                    <Plus size={16} /> New Component
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.map(item => (
                    <div key={item.id} className="p-8 rounded-2xl border border-line flex flex-col gap-6 hover:shadow-2xl hover:shadow-accent/5 transition-all bg-white relative group">
                      <div className="flex justify-between items-start">
                        <div className="italic-serif text-3xl pr-8">
                          {item.name}
                        </div>
                        <button 
                          onClick={() => handleDeleteFromDb(item.id)}
                          className="p-2 text-ink/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 items-center mt-auto">
                        <span className="unit-tag">{item.unit}</span>
                        <div className="font-bold text-xl tracking-tight">₹{item.rate.toLocaleString()} / UNIT</div>
                        {item.requiresSize && (
                          <div className="bg-accent/10 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-accent rounded">Dimensional</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 p-12 lg:p-24 overflow-y-auto"
            >
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-6">
                  <h2 className="italic-serif text-5xl tracking-tighter">History</h2>
                  <div className="flex items-center gap-4 bg-accent/5 p-1 rounded-full border border-line">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink opacity-20" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search archives..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="bg-transparent pl-9 pr-4 py-2 text-xs outline-none focus:ring-0 w-48 lg:w-64 font-bold"
                      />
                    </div>
                    <div className="h-6 w-px bg-line/20"></div>
                    <select 
                      value={historySort}
                      onChange={(e) => setHistorySort(e.target.value as 'date' | 'client')}
                      className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest focus:ring-0 cursor-pointer pr-8"
                    >
                      <option value="date">By Date</option>
                      <option value="client">By Client</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {filteredHistory.map(est => (
                    <div key={est.id} className="p-8 rounded-2xl border border-line flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-2xl hover:shadow-accent/5 transition-all bg-white group">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{est.date}</span>
                          <span className="text-[10px] bg-accent/10 px-2 py-0.5 rounded text-accent font-bold uppercase tracking-tighter">#{est.estimateNumber}</span>
                        </div>
                        <div className="italic-serif text-3xl">{est.clientName}</div>
                        {est.salespersonName && <div className="text-[10px] opacity-40 uppercase tracking-widest font-bold mt-1">Managed by {est.salespersonName}</div>}
                      </div>
                      <div className="flex flex-col md:items-end gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] opacity-40 uppercase font-black">Valuation:</span>
                          <span className="font-bold text-3xl tracking-tight">₹{est.total.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setViewingEstimate(est)}
                            className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-ink text-bg rounded-full hover:scale-105 transition-all"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => {
                              setClientName(est.clientName);
                              setSalespersonName(est.salespersonName || '');
                              setEstimateLines(est.items);
                              setFreightCharge(est.freightCharge || 0);
                              setLabourCharge(est.labourCharge || 0);
                              setActiveTab('create');
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 border border-line rounded-full hover:bg-accent/10 transition-all text-ink/60"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredHistory.length === 0 && (
                    <div className="py-24 text-center opacity-20 italic-serif text-3xl">
                      No archived estimations found
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Summary Bar */}
      {activeTab === 'create' && (
        <footer className="bg-ink text-bg px-10 py-8 flex flex-col md:flex-row items-center justify-between z-10 print:bg-transparent print:text-black print:px-0">
          <div className="flex flex-col mb-4 md:mb-0">
            <div className="italic-serif text-xl text-accent">Total Valuation</div>
          </div>
          <div className="italic-serif text-6xl md:text-8xl tracking-tighter leading-none">
            ₹{total.toLocaleString()}
          </div>
        </footer>
      )}

      {/* Persistence Info - Floating Mini */}
      <div className="fixed bottom-4 right-4 text-[9px] uppercase font-bold opacity-20 hover:opacity-100 transition-opacity bg-white/50 backdrop-blur-sm px-2 py-1 pointer-events-none print:hidden">
        LocalStorage Persistence Active
      </div>

      {/* Detail View Modal */}
      <AnimatePresence>
        {viewingEstimate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-[100] flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
            >
              <header className="px-12 py-12 border-b border-line flex justify-between items-baseline min-h-[140px] print:hidden">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest opacity-40 mb-0">Archived Estimation</div>
                  <h3 className="italic-serif text-5xl tracking-tighter">{viewingEstimate.clientName}</h3>
                  <div className="space-y-0.5 mt-1 text-xs opacity-50 font-medium">
                    {viewingEstimate.clientAddress && <p>{viewingEstimate.clientAddress}</p>}
                    {viewingEstimate.clientContact && <p>{viewingEstimate.clientContact}</p>}
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="text-xs font-bold opacity-40 tracking-widest uppercase">{viewingEstimate.date} <span className="mx-2">|</span> No: {viewingEstimate.estimateNumber}</div>
                    {viewingEstimate.salespersonName && (
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] bg-accent/10 text-accent px-2 py-0.5 rounded-sm">
                        Managed by {viewingEstimate.salespersonName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="bg-accent text-bg px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
                  >
                    <Printer size={14} /> Print
                  </button>
                  <button 
                    onClick={() => setViewingEstimate(null)}
                    className="p-4 hover:bg-ink/5 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto print:p-0">
                <div className="print:hidden">
                   {/* Internal UI view of the saved items */}
                   <div className="p-12">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="col-header text-left py-4">Description</th>
                          <th className="col-header text-center py-4">Unit</th>
                          <th className="col-header text-center py-4">Size</th>
                          <th className="col-header text-right py-4">Qty</th>
                          <th className="col-header text-right py-4">Rate</th>
                          <th className="col-header text-right py-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingEstimate.items.map(item => (
                          <tr key={item.id} className="border-b border-line/10 hover:bg-accent/5 transition-colors">
                            <td className="py-6 italic-serif text-2xl">
                              <div>{item.name}</div>
                              {item.subDescription && (
                                <div className="text-[10px] font-sans font-bold uppercase tracking-widest opacity-40 mt-1">{item.subDescription}</div>
                              )}
                            </td>
                            <td className="py-6 text-center">
                              <span className="unit-tag">{item.unit}</span>
                            </td>
                            <td className="py-6 text-center text-xs font-mono opacity-50">
                              {item.requiresSize && item.length && item.width ? (
                                <div className="flex flex-col">
                                  <span>{item.length} × {item.width}</span>
                                  <span className="text-[9px] uppercase font-bold tracking-tighter mt-0.5">{item.useInches ? 'Inches' : 'Feet'}</span>
                                </div>
                              ) : '—'}
                            </td>
                            <td className="py-6 text-right font-bold">{item.quantity}</td>
                            <td className="py-6 text-right opacity-60">₹{item.rate.toLocaleString()}</td>
                            <td className="py-6 text-right font-black">
                              ₹{(item.rate * item.quantity * (item.requiresSize ? ((item.length || 1) * (item.width || 1) / (item.useInches ? 144 : 1)) : 1)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {(viewingEstimate.freightCharge || viewingEstimate.labourCharge || viewingEstimate.discount) && (
                          <>
                            <tr className="border-b border-line/10">
                              <td colSpan={6} className="py-2"></td>
                            </tr>
                            {viewingEstimate.freightCharge ? (
                              <tr className="border-b border-line/10 opacity-70">
                                <td colSpan={5} className="py-4 text-right italic-serif pr-12">Freight / Transport Charges</td>
                                <td className="py-4 text-right font-bold tracking-tight">₹{viewingEstimate.freightCharge.toLocaleString()}</td>
                              </tr>
                            ) : null}
                            {viewingEstimate.labourCharge ? (
                              <tr className="border-b border-line/10 opacity-70">
                                <td colSpan={5} className="py-4 text-right italic-serif pr-12">Labour / Service Charges</td>
                                <td className="py-4 text-right font-bold tracking-tight">₹{viewingEstimate.labourCharge.toLocaleString()}</td>
                              </tr>
                            ) : null}
                            {viewingEstimate.discount ? (
                              <tr className="border-b border-line/10 text-red-500 opacity-80">
                                <td colSpan={5} className="py-4 text-right italic-serif pr-12">Applied Discount</td>
                                <td className="py-4 text-right font-bold tracking-tight">-₹{viewingEstimate.discount.toLocaleString()}</td>
                              </tr>
                            ) : null}
                          </>
                        )}
                      </tbody>
                    </table>
                   </div>
                </div>

                {/* The formal document version for accurate printing */}
                <div className="hidden print:block">
                   <PrintableDocument data={viewingEstimate} estNo={viewingEstimate.estimateNumber} />
                </div>
              </div>

              <footer className="h-40 bg-ink text-bg px-12 flex items-center justify-between print:hidden">
                <div>
                  <div className="italic-serif text-2xl text-accent">Final Valuation</div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="italic-serif text-7xl tracking-tighter">₹{viewingEstimate.total.toLocaleString()}</div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handlePrint}
                      className="px-8 py-2 bg-white text-ink border border-ink/20 text-[10px] font-bold uppercase tracking-widest hover:bg-ink hover:text-bg transition-all flex items-center justify-center gap-2 group"
                    >
                      <FileText size={14} className="group-hover:scale-110 transition-transform" />
                      Export PDF
                    </button>
                    <button 
                      onClick={() => {
                        setClientName(viewingEstimate.clientName);
                        setClientAddress(viewingEstimate.clientAddress || '');
                        setClientContact(viewingEstimate.clientContact || '');
                        setSalespersonName(viewingEstimate.salespersonName || '');
                        setEstimateLines(viewingEstimate.items);
                        setFreightCharge(viewingEstimate.freightCharge || 0);
                        setLabourCharge(viewingEstimate.labourCharge || 0);
                        setDiscount(viewingEstimate.discount || 0);
                        setViewingEstimate(null);
                        setActiveTab('create');
                      }}
                      className="px-8 py-2 bg-accent text-bg text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all border border-accent"
                    >
                      Edit Draft
                    </button>
                  </div>
                </div>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Preview Modal */}
      <AnimatePresence>
        {isPreviewing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-5xl h-[95vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
            >
              <div className="absolute top-6 right-6 flex items-center gap-2 z-10 print:hidden">
                <button 
                  onClick={handlePrint}
                  className="bg-accent text-bg px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 group"
                >
                  <FileText size={14} className="group-hover:scale-110 transition-transform" />
                  Print / Export PDF
                </button>
                <button 
                  onClick={() => setIsPreviewing(false)}
                  className="p-3 bg-white border border-line rounded-full hover:bg-ink/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Printable Document Content */}
              <PrintableDocument 
                data={{
                  clientName,
                  clientAddress,
                  clientContact,
                  salespersonName,
                  items: estimateLines,
                  freightCharge,
                  labourCharge,
                  discount,
                  total
                }}
                estNo={nextEstimateNo}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}

      <AnimatePresence>
        {isAddingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-bg w-full max-w-md rounded-3xl p-8 overflow-hidden relative"
            >
              <button 
                onClick={() => setIsAddingItem(false)}
                className="absolute top-6 right-6 p-2 hover:bg-ink/5 rounded-full"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold mb-8 pr-8">Define New Item</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-bold opacity-40 mb-2 block tracking-widest">Item Name</label>
                  <input 
                    type="text" 
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    placeholder="e.g. Teak Wood"
                    className="w-full bg-white px-4 py-3 rounded-xl border border-line/10 focus:border-ink outline-none transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold opacity-40 mb-2 block tracking-widest">Unit</label>
                    <select 
                      value={newItem.unit}
                      onChange={e => setNewItem({...newItem, unit: e.target.value})}
                      className="w-full bg-white px-4 py-3 rounded-xl border border-line/10 focus:border-ink outline-none transition-all font-medium appearance-none"
                    >
                      {MEASURING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold opacity-40 mb-2 block tracking-widest">Base Rate (Default)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold opacity-30">₹</span>
                      <input 
                        type="number" 
                        value={newItem.rate}
                        onChange={e => setNewItem({...newItem, rate: Number(e.target.value)})}
                        className="w-full bg-white pl-8 pr-4 py-3 rounded-xl border border-line/10 focus:border-ink outline-none transition-all font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-line/10">
                    <input 
                      type="checkbox" 
                      id="requireSize"
                      checked={newItem.requiresSize || false}
                      onChange={e => setNewItem({...newItem, requiresSize: e.target.checked})}
                      className="w-4 h-4 accent-ink"
                    />
                    <label htmlFor="requireSize" className="text-xs font-bold uppercase tracking-widest opacity-60 cursor-pointer">
                      Enable Dimensional Calculation (L × W)
                    </label>
                  </div>

                  {newItem.requiresSize && (
                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-line/10 ml-6 animate-in slide-in-from-left-2 fade-in duration-300">
                      <input 
                        type="checkbox" 
                        id="useInches"
                        checked={newItem.useInches || false}
                        onChange={e => setNewItem({...newItem, useInches: e.target.checked})}
                        className="w-4 h-4 accent-accent"
                      />
                      <label htmlFor="useInches" className="text-[10px] font-bold uppercase tracking-widest text-accent cursor-pointer">
                        Calculate Size in Inches (Converts to Sq.Ft)
                      </label>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleAddItemToDb}
                  className="w-full bg-ink text-bg py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-ink/90 transition-all mt-4"
                >
                  <Download size={18} /> Add to Library
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          body { background-color: white !important; }
          .print\\:hidden { display: none !important; }
          nav { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          .rounded-2xl { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
          input { border: none !important; display: none !important; } 
          
          /* Show targeted document */
          #printable-document {
            display: block !important;
            padding: 0 !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          /* Hide app shell */
          .fixed, .min-h-screen > header, .min-h-screen > main {
            display: none !important;
          }
          
          /* Ensure text is black for clarity */
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(20, 20, 20, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
