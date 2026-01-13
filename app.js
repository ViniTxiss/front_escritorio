/**
 * Aplicação JavaScript para Dashboard de Valor da Causa
 */

// Base URL - Configuração para desenvolvimento e produção
// Para produção: substitua 'https://seu-backend.onrender.com' pela URL real do seu backend no Render
const BASE_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:5000' 
    : (window.ENV?.API_URL || 'https://backend-7nl8.onrender.com'); // ⚠️ SUBSTITUA ESTA URL!

// Formatação de valores monetários
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

// Formatação de números
const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
};

// Função para buscar KPIs
async function fetchKPIs() {
    try {
        const response = await fetch(`${BASE_URL}/api/kpis`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const { valor_andamento, total_entradas, saving, total_encerrados } = result.data;
            
            document.getElementById('kpi-valor-andamento').textContent = formatCurrency(valor_andamento);
            document.getElementById('kpi-total-entradas').textContent = formatNumber(total_entradas);
            document.getElementById('kpi-saving').textContent = formatCurrency(saving);
            document.getElementById('kpi-total-encerrados').textContent = formatNumber(total_encerrados);
        } else {
            console.error('Erro ao buscar KPIs:', result.error);
            showError('Erro ao carregar KPIs');
        }
    } catch (error) {
        console.error('Erro na requisição de KPIs:', error);
        showError('Erro de conexão ao carregar KPIs');
    }
}

// Função para buscar dados dos gráficos
async function fetchCharts() {
    try {
        const response = await fetch(`${BASE_URL}/api/charts`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const charts = result.data;
            
            // Gráfico Top 10 Causas
            if (charts.top10_causas && charts.top10_causas.values.length > 0) {
                createBarChart('chart-top10', charts.top10_causas, 'Top 10 Causas por Valor');
            }
            
            // Gráfico por Tipo de Ação
            if (charts.valor_por_tipo && charts.valor_por_tipo.values.length > 0) {
                createPieChart('chart-tipo', charts.valor_por_tipo, 'Distribuição por Tipo de Ação');
            }
            
            // Gráfico por Responsável
            if (charts.valor_por_responsavel && charts.valor_por_responsavel.values.length > 0) {
                createBarChart('chart-responsavel', charts.valor_por_responsavel, 'Valor por Responsável');
            }
        } else {
            console.error('Erro ao buscar gráficos:', result.error);
            showError('Erro ao carregar gráficos');
        }
    } catch (error) {
        console.error('Erro na requisição de gráficos:', error);
        showError('Erro de conexão ao carregar gráficos');
    }
}

// Função para criar gráfico de barras
function createBarChart(containerId, data, title) {
    const trace = {
        x: data.labels,
        y: data.values,
        type: 'bar',
        marker: {
            color: '#3b82f6',
            line: {
                color: '#2563eb',
                width: 1
            }
        },
        text: data.values.map(v => formatCurrency(v)),
        textposition: 'auto'
    };
    
    const layout = {
        title: {
            text: title,
            font: {
                size: 16,
                color: '#1e293b'
            }
        },
        xaxis: {
            title: '',
            tickangle: -45,
            automargin: true
        },
        yaxis: {
            title: 'Valor (R$)',
            tickformat: ',.0f'
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: {
            l: 60,
            r: 30,
            t: 50,
            b: 100
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(containerId, [trace], layout, config);
}

// Função para criar gráfico de pizza
function createPieChart(containerId, data, title) {
    const trace = {
        labels: data.labels,
        values: data.values,
        type: 'pie',
        hole: 0.4,
        marker: {
            colors: [
                '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
                '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
                '#f97316', '#6366f1'
            ]
        },
        textinfo: 'label+percent',
        textposition: 'outside',
        hovertemplate: '<b>%{label}</b><br>Valor: %{text}<extra></extra>',
        texttemplate: '<b>%{label}</b><br>%{text}'
    };
    
    const layout = {
        title: {
            text: title,
            font: {
                size: 16,
                color: '#1e293b'
            }
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: {
            l: 30,
            r: 30,
            t: 50,
            b: 30
        }
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    // Format values for hover
    trace.text = data.values.map(v => formatCurrency(v));
    
    Plotly.newPlot(containerId, [trace], layout, config);
}

// Função para buscar processos
let allProcesses = [];

async function fetchProcesses() {
    try {
        const response = await fetch(`${BASE_URL}/api/processes`);
        const result = await response.json();
        
        if (result.success && result.data) {
            allProcesses = result.data;
            renderProcessesTable(allProcesses);
        } else {
            console.error('Erro ao buscar processos:', result.error);
            document.getElementById('processes-tbody').innerHTML = 
                '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Erro ao carregar processos</td></tr>';
        }
    } catch (error) {
        console.error('Erro na requisição de processos:', error);
        document.getElementById('processes-tbody').innerHTML = 
            '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Erro de conexão</td></tr>';
    }
}

// Função para renderizar tabela de processos
function renderProcessesTable(processes) {
    const tbody = document.getElementById('processes-tbody');
    
    if (!processes || processes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Nenhum processo encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = processes.map(process => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${process.processo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${formatCurrency(process.valor)}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${process.tipo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${process.data}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${process.responsavel}</td>
        </tr>
    `).join('');
}

// Função de busca na tabela
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (!searchTerm) {
            renderProcessesTable(allProcesses);
            return;
        }
        
        const filtered = allProcesses.filter(process => 
            process.processo.toLowerCase().includes(searchTerm) ||
            process.tipo.toLowerCase().includes(searchTerm) ||
            process.responsavel.toLowerCase().includes(searchTerm)
        );
        
        renderProcessesTable(filtered);
    });
}

// Função para exibir erros
function showError(message) {
    console.error(message);
    // Você pode implementar um toast ou modal de erro aqui
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    fetchKPIs();
    fetchCharts();
    fetchProcesses();
    setupSearch();
    
    // Atualiza dados a cada 5 minutos
    setInterval(() => {
        fetchKPIs();
        fetchCharts();
        fetchProcesses();
    }, 300000); // 5 minutos
});


