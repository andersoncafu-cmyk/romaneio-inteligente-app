
import React, { useState, useEffect, useMemo } from 'react';
import { Manifest, AppSettings, Invoice } from './types';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import ManifestSection from './components/ManifestSection';

const App: React.FC = () => {
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  
  // State for filtering
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // New manifest form state
  const [newManifestDate, setNewManifestDate] = useState(new Date().toISOString().split('T')[0]);

  // Load data on mount
  useEffect(() => {
    setManifests(storageService.getManifests());
  }, []);

  // Sync with storage whenever manifests or settings change
  useEffect(() => {
    storageService.saveManifests(manifests);
  }, [manifests]);

  useEffect(() => {
    storageService.saveSettings(settings);
  }, [settings]);

  const handleCreateManifest = () => {
    const newManifest: Manifest = {
      id: crypto.randomUUID(),
      date: newManifestDate,
      freightRate: settings.defaultFreightRate,
      invoices: [],
      createdAt: Date.now()
    };
    setManifests(prev => [newManifest, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
  };

  const handleDeleteManifest = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este romaneio completo?")) {
      setManifests(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleAddInvoice = (manifestId: string, number: string, companyName: string, value: number) => {
    setManifests(prev => prev.map(m => {
      if (m.id === manifestId) {
        const freight = value * (m.freightRate / 100);
        const newInvoice: Invoice = {
          id: crypto.randomUUID(),
          number,
          companyName,
          value,
          freight
        };
        return { ...m, invoices: [...m.invoices, newInvoice] };
      }
      return m;
    }));
  };

  const handleDeleteInvoice = (manifestId: string, invoiceId: string) => {
    setManifests(prev => prev.map(m => {
      if (m.id === manifestId) {
        return { ...m, invoices: m.invoices.filter(inv => inv.id !== invoiceId) };
      }
      return m;
    }));
  };

  const handleChangeRate = (manifestId: string, newRate: number) => {
    setManifests(prev => prev.map(m => {
      if (m.id === manifestId) {
        // Recalculate all freight in this manifest when rate changes
        const updatedInvoices = m.invoices.map(inv => ({
          ...inv,
          freight: inv.value * (newRate / 100)
        }));
        return { ...m, freightRate: newRate, invoices: updatedInvoices };
      }
      return m;
    }));
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await geminiService.analyzeManifests(filteredManifests);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  // Filter Logic
  const filteredManifests = useMemo(() => {
    return manifests.filter(m => {
      const isAfterStart = startDate ? m.date >= startDate : true;
      const isBeforeEnd = endDate ? m.date <= endDate : true;
      return isAfterStart && isBeforeEnd;
    });
  }, [manifests, startDate, endDate]);

  const filteredTotalValue = filteredManifests.reduce((sum, m) => 
    sum + m.invoices.reduce((s, i) => s + i.value, 0), 0);
  const filteredTotalFreight = filteredManifests.reduce((sum, m) => 
    sum + m.invoices.reduce((s, i) => s + i.freight, 0), 0);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    if (filteredManifests.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,Empresa,Nota,Valor,Taxa(%),Frete\n";

    filteredManifests.forEach(m => {
      const dateStr = new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR');
      m.invoices.forEach(inv => {
        csvContent += `${dateStr},"${inv.companyName}",${inv.number},${inv.value.toFixed(2)},${m.freightRate},${inv.freight.toFixed(2)}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `romaneios_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = () => {
    if (filteredManifests.length === 0) return;

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    let message = `*LogiTrack - Resumo de Romaneio*\n`;
    if (startDate || endDate) {
      message += `Período: ${startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'} até ${endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Fim'}\n`;
    }
    message += `----------------------------\n`;
    message += `*Total Notas:* ${formatCurrency(filteredTotalValue)}\n`;
    message += `*Total Frete:* ${formatCurrency(filteredTotalFreight)}\n`;
    message += `----------------------------\n`;
    
    // Add brief itemization
    filteredManifests.slice(0, 5).forEach(m => {
      const dateStr = new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR');
      const dayTotal = m.invoices.reduce((acc, i) => acc + i.freight, 0);
      message += `• ${dateStr}: ${formatCurrency(dayTotal)} de frete\n`;
    });

    if (filteredManifests.length > 5) {
      message += `... e mais ${filteredManifests.length - 5} romaneios.\n`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      {/* Header */}
      <header className="bg-indigo-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-white/20 p-1.5 md:p-2 rounded-lg">
              <i className="fa-solid fa-truck-fast text-lg md:text-2xl"></i>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-tight uppercase leading-none">LogiTrack</h1>
              <p className="text-[8px] md:text-[10px] text-indigo-300 font-bold tracking-widest uppercase mt-0.5">Romaneios</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-8">
             <div className="text-right flex flex-col items-end">
                <p className="text-[8px] md:text-[10px] text-indigo-300 font-bold uppercase hidden xs:block">Taxa Padrão</p>
                <div className="flex items-center gap-1">
                  <input 
                      type="number"
                      className="w-10 md:w-14 bg-indigo-800 border-none rounded px-1.5 py-1 text-xs md:text-sm font-bold focus:ring-2 focus:ring-indigo-400 outline-none text-center"
                      value={settings.defaultFreightRate}
                      onChange={(e) => setSettings({ ...settings, defaultFreightRate: parseFloat(e.target.value) || 0 })}
                  />
                  <span className="text-xs md:text-sm font-bold">%</span>
                </div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 md:pt-8">
        {/* Actions Bar */}
        <div className="space-y-4 mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-0.5">Painel de Operações</h2>
              <p className="text-sm text-slate-500">Registre novos romaneios e notas fiscais.</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 w-full md:w-auto">
              <input 
                type="date"
                value={newManifestDate}
                onChange={(e) => setNewManifestDate(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-slate-700 px-2 flex-1 text-sm md:text-base"
              />
              <button 
                onClick={handleCreateManifest}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2 rounded-lg font-bold text-sm md:text-base transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <i className="fa-solid fa-plus"></i> Novo
              </button>
            </div>
          </div>

          {/* Filter & Totals Section - Fully Responsive */}
          <div className="bg-indigo-50 border border-indigo-100 p-4 md:p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col gap-6">
              {/* Date Inputs and Export Buttons */}
              <div className="flex flex-wrap items-end gap-3 md:gap-4">
                <div className="flex-1 min-w-[140px] flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider ml-1">Início</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[140px] flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider ml-1">Fim</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
                <div className="flex gap-2 pb-1">
                   <button 
                    onClick={handleExportCSV}
                    title="Exportar CSV"
                    disabled={filteredManifests.length === 0}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 transition-colors"
                  >
                    <i className="fa-solid fa-file-csv text-lg"></i>
                  </button>
                  <button 
                    onClick={handleShareWhatsApp}
                    title="Enviar para WhatsApp"
                    disabled={filteredManifests.length === 0}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-50 transition-colors"
                  >
                    <i className="fa-brands fa-whatsapp text-lg"></i>
                  </button>
                  {(startDate || endDate) && (
                    <button 
                      onClick={clearFilters}
                      className="p-2.5 text-indigo-600 font-bold text-xs hover:underline flex items-center"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="grid grid-cols-2 gap-4 bg-white/60 p-4 rounded-xl border border-white flex-1">
                  <div className="border-r border-indigo-100 pr-2">
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Notas Filtradas</p>
                    <p className="text-base md:text-lg font-bold text-slate-700 truncate">
                      {filteredTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="pl-2">
                    <p className="text-[9px] md:text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Total do Frete</p>
                    <p className="text-lg md:text-xl font-black text-indigo-600 truncate">
                      {filteredTotalFreight.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || filteredManifests.length === 0}
                  className={`py-3 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm text-sm md:text-base ${
                    isAnalyzing ? 'bg-slate-200 text-slate-500' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  <i className={`fa-solid ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                  <span className="hidden sm:inline">Análise IA</span>
                  <span className="sm:hidden">IA</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight Section */}
        {aiAnalysis && (
          <div className="mb-6 md:mb-10 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 p-4 md:p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 -mr-10 -mt-10 rounded-full blur-3xl"></div>
            <div className="flex items-start gap-3 md:gap-4">
              <div className="bg-indigo-600 text-white p-2.5 md:p-3 rounded-full shrink-0 shadow-lg shadow-indigo-200">
                <i className="fa-solid fa-robot text-sm md:text-lg"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-indigo-900 uppercase tracking-wider text-[10px] md:text-sm">Análise Inteligente</h3>
                  <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div className="prose prose-indigo max-w-none text-slate-700 text-sm font-medium leading-relaxed">
                  {aiAnalysis.split('\n').map((para, i) => (
                    para ? <p key={i} className="mb-2 last:mb-0">{para}</p> : <br key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content List */}
        {filteredManifests.length === 0 ? (
          <div className="text-center py-16 md:py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 px-4">
             <div className="bg-slate-50 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-folder-open text-3xl md:text-4xl text-slate-300"></i>
             </div>
             <h3 className="text-lg md:text-xl font-bold text-slate-700">Nenhum romaneio</h3>
             <p className="text-sm md:text-base text-slate-400 mt-2">Ajuste as datas ou crie um novo romaneio acima.</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {filteredManifests.map(manifest => (
              <ManifestSection 
                key={manifest.id} 
                manifest={manifest} 
                onAddInvoice={handleAddInvoice}
                onDeleteInvoice={handleDeleteInvoice}
                onDeleteManifest={handleDeleteManifest}
                onChangeRate={handleChangeRate}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer Mobile Resume */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 md:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-40">
        <div className="flex justify-between items-center px-2 max-w-6xl mx-auto">
          <div>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Frete Total (Filtro)</p>
            <p className="text-base font-black text-indigo-600">
              {filteredTotalFreight.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleShareWhatsApp}
              className="bg-emerald-50 p-2.5 rounded-full text-emerald-600 active:bg-emerald-100"
            >
              <i className="fa-brands fa-whatsapp"></i>
            </button>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-indigo-50 p-2.5 rounded-full text-indigo-400 active:bg-indigo-100"
            >
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
