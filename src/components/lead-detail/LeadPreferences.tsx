import React from 'react';
import { Car, Target } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface LeadPreferencesProps {
  lead: any;
}

export const LeadPreferences: React.FC<LeadPreferencesProps> = ({ lead }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">Perfil de Interesse</h3>

      <div className="grid grid-cols-2 gap-8">
        {/* SEÇÃO CARROS */}
        {lead.preferences.interesse_carro && (
          <div className="col-span-2 space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Car size={16} className="text-brand-500" />
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Interesse em Carros</h4>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Marcas Preferenciais</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.preferences.marcas && lead.preferences.marcas.length > 0 ? (
                    lead.preferences.marcas.map(m => (
                      <span key={m} className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-bold uppercase">{m}</span>
                    ))
                  ) : <span className="text-[10px] text-slate-400 italic font-medium">Qualquer marca</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modelos</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.preferences.modelos && lead.preferences.modelos.length > 0 ? (
                    lead.preferences.modelos.map(m => (
                      <span key={m} className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-bold uppercase">{m}</span>
                    ))
                  ) : <span className="text-[10px] text-slate-400 italic font-medium">Qualquer modelo</span>}
                </div>
              </div>
              {lead.preferences.tipos_veiculo && lead.preferences.tipos_veiculo.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipos de Carro</p>
                  <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                    {lead.preferences.tipos_veiculo.join(' • ')}
                  </p>
                </div>
              )}
              <div className="col-span-2 grid grid-cols-3 gap-4 pt-3 border-t border-slate-100/50">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Máx</p>
                  <p className="text-sm font-black text-brand-600">
                    R$ {formatCurrency(lead.preferences.carro_valor_max || lead.preferences.valor_maximo || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Câmbio</p>
                  <p className="text-[11px] font-bold text-slate-700 uppercase">
                    {(lead.preferences.carro_transmissao || lead.preferences.transmissao || []).join(', ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Motor</p>
                  <p className="text-[11px] font-bold text-slate-700 uppercase">
                    {(lead.preferences.carro_motorizacao || lead.preferences.motorizacao || []).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO MOTOS */}
        {lead.preferences.interesse_moto && (
          <div className="col-span-2 space-y-4 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center">
                <Target size={10} className="text-white" />
              </div>
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Interesse em Motos</h4>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Marcas de Moto</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.preferences.marcas_moto && lead.preferences.marcas_moto.length > 0 ? (
                    lead.preferences.marcas_moto.map(m => (
                      <span key={m} className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase">{m}</span>
                    ))
                  ) : <span className="text-[10px] text-indigo-400 italic font-medium">Qualquer marca</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modelos de Moto</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.preferences.modelos_moto && lead.preferences.modelos_moto.length > 0 ? (
                    lead.preferences.modelos_moto.map(m => (
                      <span key={m} className="px-2 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-[9px] font-bold uppercase">{m}</span>
                    ))
                  ) : <span className="text-[10px] text-indigo-400 italic font-medium">Qualquer modelo</span>}
                </div>
              </div>
              {lead.preferences.tipos_moto && lead.preferences.tipos_moto.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipos de Moto</p>
                  <p className="text-[11px] font-black text-indigo-700 uppercase tracking-tight">
                    {lead.preferences.tipos_moto.join(' • ')}
                  </p>
                </div>
              )}
              <div className="col-span-2 grid grid-cols-3 gap-4 pt-3 border-t border-indigo-100/50">
                <div>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Valor Máx</p>
                  <p className="text-sm font-black text-indigo-600">
                    R$ {formatCurrency(lead.preferences.moto_valor_max || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Câmbio</p>
                  <p className="text-[11px] font-bold text-indigo-700 uppercase">
                    {(lead.preferences.moto_transmissao || []).join(', ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Motor</p>
                  <p className="text-[11px] font-bold text-indigo-700 uppercase">
                    {(lead.preferences.moto_motorizacao || []).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO CAMINHÕES */}
        {lead.preferences.interesse_caminhao && (
          <div className="col-span-2 space-y-4 p-5 bg-amber-50/30 rounded-2xl border border-amber-100/50">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center">
                <Target size={10} className="text-white" />
              </div>
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Interesse em Caminhões</h4>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Marcas de Caminhão</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.preferences.marcas_caminhao && lead.preferences.marcas_caminhao.length > 0 ? (
                    lead.preferences.marcas_caminhao.map(m => (
                      <span key={m} className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[9px] font-bold uppercase">{m}</span>
                    ))
                  ) : <span className="text-[10px] text-amber-500/70 italic font-medium">Qualquer marca</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modelos de Caminhão</p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.preferences.modelos_caminhao && lead.preferences.modelos_caminhao.length > 0 ? (
                    lead.preferences.modelos_caminhao.map(m => (
                      <span key={m} className="px-2 py-1 bg-white border border-amber-100 text-amber-600 rounded-lg text-[9px] font-bold uppercase">{m}</span>
                    ))
                  ) : <span className="text-[10px] text-amber-500/70 italic font-medium">Qualquer modelo</span>}
                </div>
              </div>
              {lead.preferences.tipos_caminhao && lead.preferences.tipos_caminhao.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipos de Caminhão</p>
                  <p className="text-[11px] font-black text-amber-700 uppercase tracking-tight">
                    {lead.preferences.tipos_caminhao.join(' • ')}
                  </p>
                </div>
              )}
              <div className="col-span-2 grid grid-cols-3 gap-4 pt-3 border-t border-amber-100/50">
                <div>
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mb-1">Valor Máx</p>
                  <p className="text-sm font-black text-amber-600">
                    R$ {formatCurrency(lead.preferences.caminhao_valor_max || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mb-1">Câmbio</p>
                  <p className="text-[11px] font-bold text-amber-700 uppercase">
                    {(lead.preferences.caminhao_transmissao || []).join(', ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mb-1">Motor</p>
                  <p className="text-[11px] font-bold text-amber-700 uppercase">
                    {(lead.preferences.caminhao_motorizacao || []).join(', ') || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(lead.preferences.possui_entrada || lead.preferences.possui_troca) && (
          <div className="col-span-2 grid grid-cols-2 gap-8 pt-4 border-t border-slate-50">
            {lead.preferences.possui_entrada && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Entrada Planejada</p>
                <p className="text-sm font-bold text-brand-600">R$ {formatCurrency(lead.preferences.valor_entrada || 0)}</p>
              </div>
            )}
            {lead.preferences.possui_troca && (
              <div className="col-span-2 md:col-span-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Veículo para Troca</p>
                {lead.preferences.troca_data && Object.keys(lead.preferences.troca_data).length > 0 && (lead.preferences.troca_data.marca || lead.preferences.troca_data.placa) ? (
                  <div className="p-4 bg-muted/40 rounded-2xl border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-foreground uppercase tracking-tight">
                          {lead.preferences.troca_data.marca} {lead.preferences.troca_data.modelo}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-semibold">
                          Ano: {lead.preferences.troca_data.ano || 'N/A'} • Cor: {lead.preferences.troca_data.cor || 'N/A'}
                        </p>
                      </div>
                      {lead.preferences.troca_data.placa && (
                        <span className="px-2 py-1 bg-slate-900 text-white dark:bg-muted dark:text-foreground rounded-lg text-[9px] font-bold tracking-wider">
                          {lead.preferences.troca_data.placa}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Quilometragem</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-foreground">
                          {lead.preferences.troca_data.quilometragem ? `${lead.preferences.troca_data.quilometragem.toLocaleString('pt-BR')} KM` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Tabela FIPE</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {lead.preferences.troca_data.valor_fipe ? `R$ ${formatCurrency(lead.preferences.troca_data.valor_fipe)}` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Status Financeiro</p>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          lead.preferences.troca_data.situacao_financeira === 'Financiado'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          {lead.preferences.troca_data.situacao_financeira || 'Quitado'}
                        </span>
                      </div>
                      {lead.preferences.troca_data.situacao_financeira === 'Financiado' && lead.preferences.troca_data.valor_quitacao && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Valor para Quitação</p>
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            R$ {formatCurrency(lead.preferences.troca_data.valor_quitacao)}
                          </p>
                        </div>
                      )}
                    </div>

                    {lead.preferences.troca_data.observacoes && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Notas da Troca</p>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-muted-foreground bg-muted/60 p-2.5 rounded-xl italic">
                          "{lead.preferences.troca_data.observacoes}"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-700 dark:text-foreground">{lead.preferences.veiculo_troca}</p>
                )}
              </div>
            )}
          </div>
        )}
        {lead.preferences.observacoes_adicionais && (
          <div className="col-span-2 pt-4 border-t border-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Observações Adicionais</p>
            <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl italic">"{lead.preferences.observacoes_adicionais}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
