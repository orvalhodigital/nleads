const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex = /  return \([\s\S]*?export default Dashboard;/;

const replacement = `  const [activeTab, setActiveTab] = useState<'geral' | 'comercial' | 'estoque' | 'agenda'>('geral');

  return (
    <div className="relative animate-fadeUp pb-24 w-full min-h-screen text-slate-800">
      {/* ──── LIQUID GLASS BACKGROUND STYLING ──── */}
      <div className="fixed inset-0 pointer-events-none z-[0] bg-[#f8fafc]" />
      <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden mix-blend-multiply opacity-50">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-emerald-400/30 rounded-full blur-[140px] animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[140px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] bg-indigo-400/10 rounded-full blur-[160px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="max-w-[1440px] mx-auto space-y-8 px-4 sm:px-6 mt-6 relative z-10">

        {/* ═══════════════════════ HEADER ═══════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-black text-slate-900 tracking-[-0.04em] flex items-center gap-3 drop-shadow-sm">
              Olá, ${"$"}{profile?.full_name?.split(' ')[0] || 'Gestor'}! <span className="text-3xl origin-bottom-right hover:animate-wiggle cursor-default">👋</span>
            </h1>
            <p className="text-slate-500 font-bold text-[13px] tracking-tight opacity-80 max-w-lg">
              Visão executiva da sua loja. Acompanhe leads, vendas, inventário de veículos e compromissos.
            </p>
          </div>
          {monthlyGoal > 0 && isGoalReached && (
            <div className="flex items-center gap-4 bg-gradient-to-br from-emerald-500 to-teal-400 text-white px-6 py-4 rounded-[24px] shadow-xl shadow-emerald-500/20 border border-emerald-400/50">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                 <Award size={24} className="text-emerald-50" />
              </div>
              <div className="flex flex-col pr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 leading-none mb-1">Meta Mensal</span>
                <span className="text-sm font-extrabold leading-none">Atingida com sucesso! 🎉</span>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════ TABS NAV ═══════════════════════ */}
        <div className="flex overflow-x-auto no-scrollbar bg-white/40 backdrop-blur-3xl p-1.5 rounded-[20px] border border-white/60 shadow-[0_8px_32px_rgb(0,0,0,0.04)] w-fit mx-auto lg:mx-0">
          {(['geral', 'comercial', 'estoque', 'agenda'] as const).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={\`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap \${activeTab === tab ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}\`}
             >
               {tab === 'geral' && 'Resumo Executivo'}
               {tab === 'comercial' && 'Performance Comercial'}
               {tab === 'estoque' && 'Saúde do Estoque'}
               {tab === 'agenda' && 'Minha Agenda'}
             </button>
          ))}
        </div>

        {/* ═══════════════════════ TAB: VISÃO GERAL ═══════════════════════ */}
        {activeTab === 'geral' && (
          <div className="space-y-8 animate-fadeUp">
            {attentionLeads.length > 0 && (
              <div className="bg-amber-400/10 backdrop-blur-3xl border border-amber-400/30 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_30px_rgb(251,191,36,0.15)] relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/20 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 bg-amber-400/30 rounded-2xl flex items-center justify-center shrink-0 border border-amber-400/40 shadow-inner">
                    <AlertTriangle size={28} className="text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-amber-900 tracking-tight leading-tight">${"$"}{attentionLeads.length} leads precisam de atenção!</h3>
                    <p className="text-xs font-semibold text-amber-800/80 mt-1 tracking-tight">Parados há muito tempo na mesma fase do funil.</p>
                  </div>
                </div>
                <button onClick={() => navigate('/leads')} className="relative z-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-amber-500/30 hover:-translate-y-0.5 whitespace-nowrap">
                  Evoluir Leads
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <KpiGlassCard label="Leads no Mês" value={leadsThisMonth.length} trend={leadsGrowth} icon={Users} colorClass="text-indigo-600 bg-indigo-500/10" glowClass="bg-indigo-400/30" />
              <KpiGlassCard label="Vendas (Mês)" value={salesThisMonth.length} trend={salesCountGrowth} icon={ShoppingBag} colorClass="text-emerald-600 bg-emerald-500/10" glowClass="bg-emerald-400/30" />
              <KpiGlassCard label="Taxa Conversão" value={\`\${conversionRate.toFixed(1)}%\`} icon={Percent} colorClass="text-purple-600 bg-purple-500/10" glowClass="bg-purple-400/30" />
              <KpiGlassCard label="Receita (Mês)" value={\`R$\${(revenueThisMonth / 1000).toFixed(0)}k\`} trend={salesGrowth} icon={DollarSign} colorClass="text-teal-600 bg-teal-500/10" glowClass="bg-teal-400/30" />
              <KpiGlassCard label="Estoque" value={availableVehicles.length} icon={Car} colorClass="text-blue-600 bg-blue-500/10" glowClass="bg-blue-400/30" />
              <KpiGlassCard label="Tick. Médio" value={\`R$\${(ticketMedioVendas / 1000).toFixed(0)}k\`} icon={Target} colorClass="text-rose-600 bg-rose-500/10" glowClass="bg-rose-400/30" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
              {monthlyGoal > 0 && (
                <div className="lg:col-span-2">
                  <GlassSection>
                    <SectionHeader icon={Award} title="Sua Meta Mensal" subtitle="O trajeto para o sucesso" color="text-teal-500 bg-teal-500/10 border-teal-500/20" />
                    <div className="mt-8 space-y-6">
                      <div className="flex justify-between items-end">
                        <p className="text-6xl font-black text-teal-600 tracking-tighter">${"$"}{salesThisMonth.length}<span className="text-2xl font-bold text-slate-400">/${"$"}{monthlyGoal}</span></p>
                        <p className="text-3xl font-black text-slate-800 opacity-90">${"$"}{goalProgress.toFixed(0)}%</p>
                      </div>
                      
                      <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                        <div className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-teal-400 to-emerald-500 shadow-sm" style={{ width: \`\${goalProgress}%\` }} />
                      </div>

                      {salesNeeded > 0 && (
                        <div className="grid grid-cols-2 mt-2 pt-6 border-t border-slate-100/50 gap-6">
                          <div>
                            <p className="text-lg font-black text-slate-700">${"$"}{daysLeftInMonth} dias</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">restantes na meta</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-amber-600">${"$"}{salesPerDayNeeded}/dia</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">velocidade necessária</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassSection>
                </div>
              )}

              <GlassSection>
                <div className="flex items-center justify-between mb-6">
                  <SectionHeader icon={FireIcon} title="Radar Quente" subtitle="Leads com alta intenção" color="text-red-500 bg-red-500/10 border-red-500/20" />
                </div>
                
                <div className="flex flex-col gap-6">
                  <div className="flex items-end justify-between px-2 pb-4">
                    <div>
                      <p className="text-5xl font-black text-slate-800 tracking-tight">${"$"}{hotLeads}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Leads Quentes 🎉</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {funnelData.filter(d => ['Visita', 'Simulação', 'Ag. Pagamento'].includes(d.name)).map((item) => (
                      <PhaseGlassBar key={item.name} label={item.name} value={item.value} total={activeLeads.length} color={item.color} />
                    ))}
                  </div>
                </div>
              </GlassSection>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB: COMERCIAL ═══════════════════════ */}
        {activeTab === 'comercial' && (
          <div className="space-y-8 animate-fadeUp">
            <GlassSection>
              <SectionHeader icon={Flame} title="Ações de Alto Impacto" subtitle="Você pode vender hoje" color="text-orange-500 bg-orange-500/10 border-orange-500/20" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <ActionMetricCard title="Matches de Carros" value={matchesProntos} subtitle="Buscam carro no estoque" icon={Car} colorClass="text-emerald-600 bg-emerald-500/10" />
                <ActionMetricCard title="A Ponto de Fechar" value={prontosParaFechar} subtitle="Simulando ou Avaliando" icon={Target} colorClass="text-sky-600 bg-sky-500/10" />
                <ActionMetricCard title="Leads Esquecidos" value={leadsEsquecidos} subtitle="Sem contato recente" icon={Clock} colorClass="text-amber-600 bg-amber-500/10" />
              </div>
            </GlassSection>

            <GlassSection>
              <SectionHeader icon={DollarSign} title="Performance Financeira" subtitle="Destaques de vendas do mês" color="text-emerald-500 bg-emerald-500/10 border-emerald-500/20" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pb-8 border-b border-slate-100/50">
                <div className="md:col-span-2">
                   <MiniStat label="Faturamento Total (Mês)" value={\`R$ \${formatCurrency(revenueThisMonth)}\`} trend={salesGrowth} />
                </div>
                <div>
                   <MiniStat label="Ticket Médio" value={\`R$ \${formatCurrency(ticketMedioVendas)}\`} icon={Target} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                <MiniStat label="Com Entrada" value={leadsComEntrada} icon={Handshake} />
                <MiniStat label="Com Troca" value={leadsComTroca} icon={Repeat} />
                <MiniStat label="Tempo Méd. Venda" value={\`\${avgSaleCycleDays} dias\`} icon={Timer} />
                <MiniStat label="Desqualificados" value={disqualified.length} icon={UserX} />
              </div>

              {salesByBrand.length > 0 && (
                <div className="mt-10">
                  <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-6 flex items-center gap-2"><Award size={14}/> Vendas por Marca (Mês)</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesByBrand} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fontWeight: 800, fill: '#64748b' }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 12, 12, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </GlassSection>
          </div>
        )}

        {/* ═══════════════════════ TAB: ESTOQUE ═══════════════════════ */}
        {activeTab === 'estoque' && (
          <div className="space-y-8 animate-fadeUp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassSection>
                <SectionHeader icon={Car} title="Inventário Atual" subtitle="Giro e Valor" color="text-indigo-500 bg-indigo-500/10 border-indigo-500/20" />
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <MiniStat label="Veículos Disp." value={availableVehicles.length} icon={Car} />
                  <MiniStat label="Giro Mensal" value={\`\${stockTurnover}%\`} icon={TrendingUp} />
                </div>
                <div className="mt-6 mb-6">
                   <MiniStat label="Valor Imobilizado Completo" value={\`R$ \${formatCurrency(totalStockValue)}\`} icon={DollarSign} />
                </div>
                
                <div className="mt-8 p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-4">
                   <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-slate-500">Mais Caro</span>
                     <span className="font-black text-slate-900">\`R$ \${mostExpensive ? formatCurrency(mostExpensive.price) : 0}\`</span>
                   </div>
                   <div className="h-px bg-slate-200" />
                   <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-slate-500">Mais Barato</span>
                     <span className="font-black text-slate-900">\`R$ \${cheapest ? formatCurrency(cheapest.price) : 0}\`</span>
                   </div>
                </div>
              </GlassSection>

              <GlassSection>
                <SectionHeader icon={Package} title="Alerta de Estoque" subtitle="Carros que ninguém procurou" color="text-rose-500 bg-rose-500/10 border-rose-500/20" />
                <div className="mt-8 flex flex-col items-center justify-center text-center py-16 border border-dashed border-rose-300 bg-rose-50/50 rounded-[32px]">
                   <p className="text-6xl font-black text-rose-600 mb-4">${"$"}{estoqueParado}</p>
                   <p className="text-sm font-bold uppercase tracking-widest text-rose-500/80">veículos sem leads compatíveis</p>
                </div>
              </GlassSection>
            </div>

            <GlassSection>
              <SectionHeader icon={BarChart3} title="Inteligência de Mercado" subtitle="O que pesquisam na loja" color="text-purple-500 bg-purple-500/10 border-purple-500/20" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mt-10">
                <ChartCard title="Interesse por Marca" data={brandInterest} />
                <ChartCard title="Tipo de Veículo" data={typeInterest} />
                <ChartCard title="Modelo Busca" data={modelInterest} />
                <ChartCard title="Origem / Canal" data={leadSources} />
              </div>
            </GlassSection>

          </div>
        )}

        {/* ═══════════════════════ TAB: AGENDA ═══════════════════════ */}
        {activeTab === 'agenda' && (
          <div className="space-y-8 animate-fadeUp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassSection>
                <div className="flex items-center justify-between mb-8">
                  <SectionHeader icon={Calendar} title="Agenda Visitas" subtitle="Resumo do dia" color="text-rose-500 bg-rose-500/10 border-rose-500/20" />
                  <button onClick={() => navigate('/agenda')} className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1">
                    <ArrowRight size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <AgendaRow icon={Users} label="Visitas Agendadas" value={visitsTodayCount} subtitle="Total para o dia de hoje" colorClass="text-amber-600 bg-amber-50" />
                  <AgendaRow icon={CheckCircle2} label="Visitas Realizadas" value={visitsDone} subtitle="Concluídas com sucesso" colorClass="text-emerald-600 bg-emerald-50 border border-emerald-100" />
                </div>
              </GlassSection>

              <GlassSection>
                 <div className="flex items-center justify-between mb-8">
                  <SectionHeader icon={PhoneCall} title="Follow-Ups" subtitle="Cobre os clientes hoje" color="text-blue-500 bg-blue-500/10 border-blue-500/20" />
                </div>
                 <div className="space-y-4">
                  <AgendaRow icon={PhoneCall} label="Follow-Ups p/ Hoje" value={followupsTodayCount} subtitle="Ligue ou mande mensagem" colorClass="text-blue-600 bg-blue-50" />
                </div>
              </GlassSection>

              <div className="col-span-1 lg:col-span-2">
                <GlassSection>
                  <div className="flex items-center justify-between mb-8">
                    <SectionHeader icon={Clock} title="Projeção Amanhã" subtitle="O que está por vir" color="text-slate-500 bg-slate-100 border-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                       <p className="text-5xl font-black text-slate-800">${"$"}{visitsTomorrowCount}</p>
                       <p className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mt-3">Novas Visitas</p>
                     </div>
                     <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center shadow-inner">
                       <p className="text-5xl font-black text-slate-800">${"$"}{followupsTomorrowCount}</p>
                       <p className="text-[11px] uppercase font-bold tracking-widest text-slate-400 mt-3">Retornos Follow Up</p>
                     </div>
                  </div>
                </GlassSection>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════ LIGUID GLASS SUBCOMPONENTS ═══════════════════════
const FireIcon = Flame;

const GlassSection = ({ children }: any) => (
  <div className="bg-white/50 backdrop-blur-3xl border border-white/60 p-8 md:p-10 rounded-[40px] shadow-[0_8px_32px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] transition-all">
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, color }: any) => (
  <div className="flex items-center gap-5">
    <div className={\`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner border \${color}\`}>
      <Icon size={24} className="opacity-90" strokeWidth={2.5} />
    </div>
    <div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title}</h2>
      <p className="text-[11px] uppercase tracking-widest font-black text-slate-400 mt-2 opacity-80">{subtitle}</p>
    </div>
  </div>
);

const KpiGlassCard = ({ label, value, trend, icon: Icon, colorClass, glowClass }: any) => (
  <div className="bg-white/60 backdrop-blur-3xl border border-white/80 p-6 rounded-[32px] shadow-[0_8px_24px_rgb(0,0,0,0.03)] hover:shadow-2xl hover:-translate-y-2 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
    <div className={\`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl transition-transform group-hover:scale-[2] \${glowClass}\`} />
    <div className="flex justify-between items-start relative z-10">
      <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner \${colorClass}\`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      {trend !== undefined && trend !== 0 && (
        <span className={\`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-xl shadow-sm border border-white/40 \${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}\`}>
          {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
        </span>
      )}
    </div>
    <div className="relative z-10 mt-auto pt-6">
      <h3 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-none break-all">{value}</h3>
      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-2">{label}</p>
    </div>
  </div>
);

const ActionMetricCard = ({ title, value, subtitle, icon: Icon, colorClass, action }: any) => (
  <div onClick={action} className={\`bg-white/60 backdrop-blur-md border border-white/60 p-6 rounded-[32px] shadow-sm flex flex-col justify-between min-h-[160px] \${action ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all' : ''}\`}>
    <div className="flex items-start justify-between mb-4">
       <div className={\`w-12 h-12 rounded-[20px] shadow-inner flex items-center justify-center \${colorClass}\`}>
          <Icon size={20} strokeWidth={2.5} />
       </div>
       <p className="text-4xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
    </div>
    <div className="mt-auto">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</p>
      <p className="text-[10px] font-bold text-slate-400 truncate opacity-70">{subtitle}</p>
    </div>
  </div>
);

const MiniStat = ({ label, value, subtitle, icon: Icon, trend }: any) => (
  <div className="bg-white/60 border border-white/80 p-6 rounded-[28px] shadow-sm relative overflow-hidden">
    <div className="flex items-center justify-between mb-4 relative z-10">
      <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 truncate pr-2">{label}</p>
      {Icon && <Icon size={16} className="text-slate-300 shrink-0" />}
    </div>
    <div className="flex items-center gap-3 relative z-10">
      <p className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight truncate">{value}</p>
      {trend !== undefined && trend !== 0 && (
         <span className={\`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-lg \${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}\`}>
           {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
         </span>
      )}
    </div>
    {subtitle && <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest truncate relative z-10">{subtitle}</p>}
  </div>
);

const PhaseGlassBar = ({ label, value, total, color }: any) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="group">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
        <span>{label}</span>
        <span className="text-slate-800">{value} <span className="text-slate-300 opacity-50 ml-1">({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: \`\${pct}%\`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const ChartCard = ({ title, data }: { title: string, data: any[] }) => (
  <div>
    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">{title}</h3>
    {data.length > 0 ? (
      <div className="space-y-4">
        {data.slice(0, 4).map((item: any, idx: number) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="text-xs font-black text-slate-600 truncate max-w-[120px] capitalize">{item.name}</span>
            </div>
            <span className="text-xs font-black text-slate-800 bg-slate-100/50 px-2 py-0.5 rounded-lg">{item.value}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest">Sem dados</p>
    )}
  </div>
);

const AgendaRow = ({ icon: Icon, label, value, subtitle, colorClass }: any) => (
  <div className="flex items-center justify-between p-5 rounded-[24px] border border-white/80 bg-white/60 shadow-sm hover:shadow-md transition-shadow cursor-default">
    <div className="flex items-center gap-5">
      <div className={\`w-12 h-12 rounded-[18px] flex items-center justify-center shadow-inner \${colorClass}\`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-800 tracking-tight">{label}</h4>
        {subtitle && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">{subtitle}</p>}
      </div>
    </div>
    <span className="text-3xl font-black text-slate-800 px-2">{value}</span>
  </div>
);

export default Dashboard;
`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/components/Dashboard.tsx', code);
    console.log('Replaced successfully');
} else {
    console.log('Regex did not match.');
}
