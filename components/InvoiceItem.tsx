
import React from 'react';
import { Invoice } from '../types';

interface InvoiceItemProps {
  invoice: Invoice;
  onDelete: (id: string) => void;
}

const InvoiceItem: React.FC<InvoiceItemProps> = ({ invoice, onDelete }) => {
  return (
    <div className="flex flex-col p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-all gap-3 group relative">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Cliente</p>
          <p className="font-bold text-slate-800 truncate text-sm md:text-base" title={invoice.companyName}>
            {invoice.companyName}
          </p>
        </div>
        <button 
          onClick={() => onDelete(invoice.id)}
          className="text-slate-200 hover:text-red-500 transition-colors p-1.5 -mr-1.5 -mt-1.5"
          title="Remover nota"
        >
          <i className="fa-solid fa-trash-can text-sm"></i>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-3 border-t border-slate-50">
        <div className="col-span-1">
          <p className="text-[9px] text-slate-500 uppercase font-semibold mb-0.5">Nº Nota</p>
          <p className="text-xs font-bold text-slate-700">{invoice.number}</p>
        </div>
        <div className="col-span-1 text-right">
          <p className="text-[9px] text-slate-500 uppercase font-semibold mb-0.5">Valor Nota</p>
          <p className="text-xs font-bold text-slate-700">
            {invoice.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="col-span-2 bg-indigo-50/50 p-2 rounded-lg flex justify-between items-center mt-1">
          <p className="text-[9px] text-indigo-400 uppercase font-black tracking-wider">Resultado Frete</p>
          <p className="text-sm font-black text-indigo-700">
            {invoice.freight.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceItem;
