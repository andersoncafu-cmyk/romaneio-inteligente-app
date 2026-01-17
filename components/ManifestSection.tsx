
import React, { useState } from 'react';
import { Manifest, Invoice } from '../types';
import InvoiceItem from './InvoiceItem';

interface ManifestSectionProps {
  manifest: Manifest;
  onAddInvoice: (manifestId: string, number: string, companyName: string, value: number) => void;
  onDeleteInvoice: (manifestId: string, invoiceId: string) => void;
  onDeleteManifest: (manifestId: string) => void;
  onChangeRate: (manifestId: string, newRate: number) => void;
}

const ManifestSection: React.FC<ManifestSectionProps> = ({ 
  manifest, 
  onAddInvoice, 
  onDeleteInvoice, 
  onDeleteManifest,
  onChangeRate 
}) => {
  const [invNumber, setInvNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [invValue, setInvValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const totalValue = manifest.invoices.reduce((sum, inv) => sum + inv.value, 0);
  const totalFreight = manifest.invoices.reduce((sum, inv) => sum + inv.freight, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(invValue.replace(',', '.'));
    if (invNumber && companyName && !isNaN(val)) {
      onAddInvoice(manifest.id, invNumber, companyName, val);
      setInvNumber('');
      setCompanyName('');
      setInvValue('');
      setIsAdding(false);
    }
  };

  return (
    <div className="mb-6 md:mb-8 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header da Seção */}
      <div className="bg-white px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
            <i className="fa-solid fa-calendar-day text-lg md:text-xl"></i>
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg text-slate-800">
              {new Date(manifest.date + 'T00:00:00').toLocaleDateString('pt-BR')}
            </h3>
            <p className="text-[10px] md:text-xs text-slate-500 uppercase font-semibold">
              {manifest.invoices.length} nota(s) fiscal(is)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 border-t md:border-t-0 pt-3 md:pt-0">
          <div className="text-left md:text-right">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Taxa Frete</p>
            <div className="flex items-center gap-1.5">
               <input 
                type="number"
                step="0.1"
                value={manifest.freightRate}
                onChange={(e) => onChangeRate(manifest.id, parseFloat(e.target.value))}
                className="w-12 bg-indigo-50/50 border-b border-indigo-200 text-indigo-600 font-bold text-center focus:border-indigo-500 outline-none rounded-t text-sm"
              />
              <span className="text-indigo-600 font-bold text-sm">%</span>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Frete</p>
            <p className="text-lg font-black text-indigo-600">
              {totalFreight.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          <button 
            onClick={() => onDeleteManifest(manifest.id)}
            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
          >
            <i className="fa-solid fa-circle-xmark text-xl md:text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Conteúdo das Notas */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          {manifest.invoices.map(invoice => (
            <InvoiceItem 
              key={invoice.id} 
              invoice={invoice} 
              onDelete={(id) => onDeleteInvoice(manifest.id, id)} 
            />
          ))}
          
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all bg-white/50 min-h-[100px] text-sm md:text-base font-semibold"
            >
              <i className="fa-solid fa-plus-circle mr-2 text-lg"></i> Adicionar Nota
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="bg-indigo-50 p-4 md:p-5 rounded-xl border border-indigo-200 flex flex-col gap-3 shadow-inner">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">Empresa / Cliente</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Nome do Cliente"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="px-3 py-2.5 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">Nº Nota</label>
                  <input 
                    type="text"
                    placeholder="Número"
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-400 outline-none text-sm w-full"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">Valor Nota</label>
                  <input 
                    type="text"
                    placeholder="0.000,00"
                    value={invValue}
                    onChange={(e) => setInvValue(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-400 outline-none text-sm w-full"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100"
                >
                  Salvar
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-white text-slate-600 py-2.5 rounded-lg text-sm font-medium border border-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200/60">
           <div className="text-right">
             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">Valor Total Notas:</span>
             <span className="text-base md:text-lg font-bold text-slate-700">
               {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ManifestSection;
